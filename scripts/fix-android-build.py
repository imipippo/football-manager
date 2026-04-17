import os
import re
import glob

KOTLIN_VERSION = "1.9.25"

print("=== Android Build Fix Script v2 ===")
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
        result.extend(glob.glob(os.path.join(base_dir, pattern), recursive=True))
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
            matches = re.findall(pattern, content)
            print(f"  [{filepath}] Pattern matched")
            content = new_content
            changed = True

    return content, changed

print("\n[Step 1] Fix Kotlin version in ALL Gradle files")
android_dir = "mobile/android"
if os.path.exists(android_dir):
    gradle_files = find_files(android_dir, ["**/*.gradle", "**/*.gradle.kts", "**/*.toml"])
    for filepath in gradle_files:
        content = read_file(filepath)
        if content is None:
            continue
        if "kotlin" not in content.lower():
            continue
        new_content, changed = replace_kotlin_version_in_content(content, filepath)
        if changed:
            write_file(filepath, new_content)
            print(f"  FIXED: {filepath}")
            for i, (old, new) in enumerate(zip(content.split('\n'), new_content.split('\n'))):
                if old != new:
                    print(f"    Line {i+1}: {old.strip()} -> {new.strip()}")
        else:
            print(f"  OK (no change needed): {filepath}")
else:
    print(f"  ERROR: {android_dir} does not exist!")

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

print("\n[Step 3] Add Kotlin null-safety compiler options to app/build.gradle")
app_build_path = os.path.join(android_dir, "app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)

    if "freeCompilerArgs" not in content:
        kotlin_options_block = """
    kotlinOptions {
        jvmTarget = '17'
        freeCompilerArgs += [
            '-Xjvm-default=all',
            '-Xno-optimized-callable-references'
        ]
    }
"""

        if "kotlinOptions" in content:
            content = re.sub(
                r'kotlinOptions\s*\{[^}]*\}',
                kotlin_options_block,
                content,
                flags=re.DOTALL
            )
            print("  Updated existing kotlinOptions block with freeCompilerArgs")
        else:
            android_block_match = re.search(r'(android\s*\{)', content)
            if android_block_match:
                insert_pos = android_block_match.end()
                content = content[:insert_pos] + kotlin_options_block + content[insert_pos:]
                print("  Added kotlinOptions block inside android {}")
            else:
                print("  WARNING: Could not find android {} block")

    write_file(app_build_path, content)
    print(f"  {app_build_path} updated")
else:
    print(f"  WARNING: {app_build_path} not found")

print("\n[Step 4] Remove React Native plugin conflicts from app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)

    lines_to_remove = [
        'com.facebook.react',
        'react-android',
    ]

    lines = content.split('\n')
    new_lines = []
    removed = 0
    for line in lines:
        if any(pattern in line for pattern in lines_to_remove):
            if 'apply plugin' in line or 'implementation' in line or 'id(' in line or 'id ' in line:
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
        print(f"  Removed {removed} conflicting lines")

    if "hermesEnabled" not in '\n'.join(final_lines):
        content = '\n'.join(final_lines)
        content = "def hermesEnabled = true\n" + content
        write_file(app_build_path, content)
        print("  Added hermesEnabled definition")

print("\n[Step 5] Force Kotlin version in expo-modules-core build.gradle")
expo_modules = find_files(android_dir, ["**/expo-modules-core/**/build.gradle"])
for filepath in expo_modules:
    content = read_file(filepath)
    if content and "kotlin" in content.lower():
        new_content, changed = replace_kotlin_version_in_content(content, filepath)
        if changed:
            write_file(filepath, new_content)
            print(f"  FIXED: {filepath}")

print("\n[Step 6] Force Kotlin version in react-native-gesture-handler build.gradle")
gesture_files = find_files(android_dir, ["**/react-native-gesture-handler/**/build.gradle"])
for filepath in gesture_files:
    content = read_file(filepath)
    if content and "kotlin" in content.lower():
        new_content, changed = replace_kotlin_version_in_content(content, filepath)
        if changed:
            write_file(filepath, new_content)
            print(f"  FIXED: {filepath}")

print("\n=== Verification ===")
root_build = read_file(os.path.join(android_dir, "build.gradle"))
if root_build:
    for line in root_build.split('\n'):
        if 'kotlin' in line.lower() and '=' in line:
            print(f"  root build.gradle: {line.strip()}")

app_build = read_file(app_build_path)
if app_build:
    if "freeCompilerArgs" in app_build:
        print("  freeCompilerArgs: PRESENT")

props = read_file(props_path)
if props:
    for line in props.split('\n'):
        if 'kotlin' in line.lower():
            print(f"  gradle.properties: {line.strip()}")

print("\n=== Fix script completed ===")
