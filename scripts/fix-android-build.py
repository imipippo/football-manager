import os
import re
import glob

KOTLIN_VERSION = "1.9.25"

print("=== Android Build Fix Script v10 ===")
print(f"Target Kotlin version: {KOTLIN_VERSION}")

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def find_files(base_dir, patterns):
    result = []
    for pattern in patterns:
        found = glob.glob(os.path.join(base_dir, pattern), recursive=True)
        print(f"  Pattern '{pattern}' found: {len(found)} files")
        for file in found:
            print(f"    - {file}")
        result.extend(found)
    return result

def replace_kotlin_version_in_content(content, filepath):
    changed = False
    patterns = [
        (r'(ext\.kotlinVersion\s*=\s*)"[^"]*"', r'\g<1>"' + KOTLIN_VERSION + '"'),
        (r'(kotlinVersion\s*=\s*)"[^"]*"', r'\g<1>"' + KOTLIN_VERSION + '"'),
        (r'(kotlin\s*=\s*)"[^"]*"', r'\g<1>"' + KOTLIN_VERSION + '"'),
        (r'(org\.jetbrains\.kotlin:kotlin-gradle-plugin:)([\d.]+)', r'\g<1>' + KOTLIN_VERSION),
        (r'(org\.jetbrains\.kotlin\.(?:android|jvm|multiplatform)\s*=\s*)"[^"]*"', r'\g<1>"' + KOTLIN_VERSION + '"'),
        (r'(kotlinAndroid\s*=\s*)"[^"]*"', r'\g<1>"' + KOTLIN_VERSION + '"'),
    ]
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            print(f"  [{filepath}] Pattern matched")
            content = new_content
            changed = True
    return content, changed

def remove_kotlin_options_blocks_from_file(filepath):
    content = read_file(filepath)
    if not content:
        return False
    if 'kotlinOptions' not in content and 'plugins.withId' not in content:
        return False

    original_content = content
    lines = content.split('\n')
    new_lines = []
    skip_block = False
    brace_count = 0

    for line in lines:
        stripped = line.strip()

        if skip_block:
            brace_count += stripped.count('{') - stripped.count('}')
            if brace_count <= 0:
                skip_block = False
            continue

        if 'plugins.withId' in stripped and 'kotlin' in stripped.lower():
            skip_block = True
            brace_count = stripped.count('{') - stripped.count('}')
            continue

        if 'if' in stripped and 'plugins.hasPlugin' in stripped and 'kotlin' in stripped.lower():
            skip_block = True
            brace_count = stripped.count('{') - stripped.count('}')
            continue

        if 'kotlinOptions' in stripped and '{' in stripped:
            skip_block = True
            brace_count = stripped.count('{') - stripped.count('}')
            continue

        new_lines.append(line)

    content = '\n'.join(new_lines)
    if content != original_content:
        write_file(filepath, content)
        print(f"  Removed kotlinOptions blocks from {filepath}")
        return True
    return False

print("\n[Step 1] Fix Kotlin version in root build.gradle")
android_dir = "mobile/android"
root_build_path = os.path.join(android_dir, "build.gradle")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    new_content, changed = replace_kotlin_version_in_content(content, root_build_path)
    if changed:
        write_file(root_build_path, new_content)
        print(f"  FIXED: {root_build_path}")
    else:
        print(f"  OK (no change needed): {root_build_path}")
else:
    print(f"  ERROR: {root_build_path} does not exist!")

print("\n[Step 2] Fix gradle.properties")
props_path = os.path.join(android_dir, "gradle.properties")
props_lines = []
props_keys = set()

if os.path.exists(props_path):
    existing = read_file(props_path)
    for line in existing.split('\n'):
        stripped = line.strip()
        if '=' in stripped and not stripped.startswith('#'):
            key = stripped.split('=')[0].strip()
            props_keys.add(key)
        props_lines.append(line)

required_props = {
    "kotlinVersion": KOTLIN_VERSION,
    "hermesEnabled": "true",
    "android.useAndroidX": "true",
    "android.enableJetifier": "true",
    "org.gradle.jvmargs": "-Xmx4608m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8",
    "org.gradle.daemon": "false",
    "org.gradle.parallel": "true",
    "org.gradle.caching": "true",
}

for key, value in required_props.items():
    if key not in props_keys:
        props_lines.append(f"{key}={value}")
        print(f"  Added: {key}={value}")
    else:
        new_lines = []
        for line in props_lines:
            stripped = line.strip()
            if '=' in stripped and not stripped.startswith('#'):
                k = stripped.split('=')[0].strip()
                if k == key:
                    old_val = stripped.split('=', 1)[1].strip()
                    if old_val != value:
                        line = f"{key}={value}"
                        print(f"  Updated: {key}={old_val} -> {value}")
            new_lines.append(line)
        props_lines = new_lines

write_file(props_path, '\n'.join(props_lines) + '\n')
print(f"  gradle.properties written")

print("\n[Step 3] Fix kotlinOptions in app/build.gradle ONLY")
app_build_path = os.path.join(android_dir, "app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)
    if 'kotlinOptions' in content:
        new_content = re.sub(
            r'kotlinOptions\s*\{[^}]*\}',
            """kotlinOptions {
            jvmTarget = '17'
            freeCompilerArgs += [
                '-Xjvm-default=all',
                '-Xno-optimized-callable-references',
                '-Xno-call-assertions',
                '-Xno-param-assertions',
                '-Xno-strict-conditional-prepare-analyzer',
                '-Xno-new-inference'
            ]
        }""",
            content,
            flags=re.DOTALL
        )
        if new_content != content:
            write_file(app_build_path, new_content)
            print(f"  Updated kotlinOptions in app/build.gradle")
    else:
        android_match = re.search(r'(android\s*\{)', content)
        if android_match:
            insert_pos = android_match.end()
            kotlin_options = """
        kotlinOptions {
            jvmTarget = '17'
            freeCompilerArgs += [
                '-Xjvm-default=all',
                '-Xno-optimized-callable-references',
                '-Xno-call-assertions',
                '-Xno-param-assertions',
                '-Xno-strict-conditional-prepare-analyzer',
                '-Xno-new-inference'
            ]
        }
"""
            content = content[:insert_pos] + kotlin_options + content[insert_pos:]
            write_file(app_build_path, content)
            print(f"  Added kotlinOptions to app/build.gradle")
else:
    print(f"  ERROR: {app_build_path} not found")

print("\n[Step 4] Remove React Native plugin conflicts from app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)
    lines_to_remove = [
        'apply plugin.*react',
        'id \'com.facebook.react\'',
        'id(\'com.facebook.react\')',
    ]
    lines = content.split('\n')
    new_lines = []
    removed = 0
    for line in lines:
        if any(pattern in line for pattern in lines_to_remove):
            print(f"  Removed: {line.strip()}")
            removed += 1
            continue
        new_lines.append(line)

    in_react_block = False
    brace_count = 0
    final_lines = []
    for line in new_lines:
        stripped = line.strip()
        if re.match(r'^react\s*\{', stripped) and not in_react_block:
            in_react_block = True
            brace_count = stripped.count('{') - stripped.count('}')
            removed += 1
            continue
        if in_react_block:
            brace_count += stripped.count('{') - stripped.count('}')
            if brace_count <= 0:
                in_react_block = False
            continue
        final_lines.append(line)

    if removed > 0:
        write_file(app_build_path, '\n'.join(final_lines))
        print(f"  Removed {removed} conflicting plugin lines")

    if "hermesEnabled" not in '\n'.join(final_lines):
        content = '\n'.join(final_lines)
        content = "def hermesEnabled = true\n" + content
        write_file(app_build_path, content)
        print("  Added hermesEnabled definition")

print("\n[Step 5] Fix Kotlin version in settings.gradle")
settings_path = os.path.join(android_dir, "settings.gradle")
if os.path.exists(settings_path):
    content = read_file(settings_path)
    new_content, changed = replace_kotlin_version_in_content(content, settings_path)
    if changed:
        write_file(settings_path, new_content)
        print(f"  FIXED: {settings_path}")
    else:
        print(f"  OK (no change needed): {settings_path}")
else:
    print(f"  WARNING: {settings_path} not found")

print("\n[Step 6] Fix Kotlin version in gradle/libs.versions.toml")
toml_files = find_files(android_dir, ["**/*.toml"])
for filepath in toml_files:
    content = read_file(filepath)
    if content and "kotlin" in content.lower():
        new_content, changed = replace_kotlin_version_in_content(content, filepath)
        if changed:
            write_file(filepath, new_content)
            print(f"  FIXED: {filepath}")
        else:
            print(f"  OK (no change needed): {filepath}")

print("\n[Step 7] Fix Kotlin version in node_modules (version only, NO kotlinOptions)")
node_modules_gradle_files = find_files("mobile", ["**/node_modules/**/build.gradle"])
for filepath in node_modules_gradle_files:
    content = read_file(filepath)
    if content:
        new_content, changed = replace_kotlin_version_in_content(content, filepath)
        if changed:
            write_file(filepath, new_content)
            print(f"  Updated Kotlin version in: {filepath}")

print("\n[Step 8] Remove any kotlinOptions blocks from node_modules (cleanup)")
for filepath in node_modules_gradle_files:
    remove_kotlin_options_blocks_from_file(filepath)

print("\n=== Verification ===")
root_build = read_file(os.path.join(android_dir, "build.gradle"))
if root_build:
    for line in root_build.split('\n'):
        if 'kotlin' in line.lower() and '=' in line:
            print(f"  root build.gradle: {line.strip()}")

app_build = read_file(app_build_path)
if app_build:
    if "freeCompilerArgs" in app_build:
        print("  app/build.gradle: freeCompilerArgs: PRESENT")
    if "kotlinOptions" in app_build:
        print("  app/build.gradle: kotlinOptions: PRESENT")

props = read_file(props_path)
if props:
    for line in props.split('\n'):
        if 'kotlin' in line.lower():
            print(f"  gradle.properties: {line.strip()}")

print("\n  Checking node_modules for remaining kotlinOptions...")
found_kotlin_options = False
for filepath in node_modules_gradle_files:
    content = read_file(filepath)
    if content and 'kotlinOptions' in content:
        print(f"  WARNING: kotlinOptions still in {filepath}")
        found_kotlin_options = True
if not found_kotlin_options:
    print("  OK: No kotlinOptions in node_modules")

print("\n=== Fix script completed ===")
