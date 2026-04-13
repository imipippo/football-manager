import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Safe bracket-aware block replacement")

TARGET_AGP = "8.7.0"
TARGET_KOTLIN = "1.9.22"

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def find_matching_brace(text, start_pos):
    """Find the position of the closing brace that matches the opening brace at start_pos"""
    if start_pos >= len(text) or text[start_pos] != '{':
        return -1
    depth = 0
    in_string = False
    string_char = None
    i = start_pos
    while i < len(text):
        char = text[i]
        
        if in_string:
            if char == '\\' and i + 1 < len(text):
                i += 2
                continue
            if char == string_char:
                in_string = False
        else:
            if char in ('"', "'"):
                in_string = True
                string_char = char
            elif char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1

def find_block(text, keyword):
    """Find a top-level {block} starting with keyword (e.g., 'pluginManagement', 'plugins')"""
    pattern = re.compile(rf'\b{keyword}\s*\{{')
    match = pattern.search(text)
    if not match:
        return -1, -1
    
    start = match.start()
    brace_start = match.end() - 1
    end = find_matching_brace(text, brace_start)
    
    if end == -1:
        return -1, -1
    return start, end + 1

print("\n[Step 1] Fix hermesEnabled in app/build.gradle")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    lines = content.split("\n")
    filtered = [l for l in lines if not (l.strip().startswith("hermesEnabled") and "=" in l)]
    write_file(app_build, "\n".join(filtered))
    print("  ✓ Removed hermesEnabled from wrong location")

print("\n[Step 2] Safely update settings.gradle")
settings_path = "mobile/android/settings.gradle"
if os.path.exists(settings_path):
    content = read_file(settings_path)
    
    new_plugin_mgmt = """pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}"""

    new_plugins = """plugins {{
    id("com.android.application") version "{}" apply false
    id("com.android.library") version "{}" apply false
    id("org.jetbrains.kotlin.android") version "{}" apply false
}}""".format(TARGET_AGP, TARGET_AGP, TARGET_KOTLIN)
    
    pm_start, pm_end = find_block(content, "pluginManagement")
    
    if pm_start >= 0:
        content = content[:pm_start] + new_plugin_mgmt + content[pm_end:]
        print("  ✓ Replaced pluginManagement block (bracket-safe)")
    else:
        content = new_plugin_mgmt + "\n" + content
        print("  ✓ Added pluginManagement block")
    
    pl_start, pl_end = find_block(content, "plugins")
    
    if pl_start >= 0:
        content = content[:pl_start] + new_plugins + content[pl_end:]
        print(f"  ✓ Replaced plugins block with AGP {TARGET_AGP}")
    else:
        content = content.rstrip() + "\n\n" + new_plugins + "\n"
        print(f"  ✓ Added plugins block with AGP {TARGET_AGP}")
    
    write_file(settings_path, content)
else:
    print(f"  ✗ {settings_path} not found!")

print("\n[Step 3] Override .toml files")
toml_paths = []
for root, dirs, files in os.walk("mobile/android"):
    for f in files:
        if f.endswith(".toml"):
            toml_paths.append(os.path.join(root, f))

for toml_path in toml_paths:
    content = read_file(toml_path)
    orig = content
    
    content = re.sub(
        r'(agp|androidGradlePlugin)\s*=\s*"[^"]*"',
        f'\\1 = "{TARGET_AGP}"',
        content,
    )
    
    content = re.sub(
        r'(kotlin|kotlinAndroid)\s*=\s*"[^"]*"',
        f'\\1 = "{TARGET_KOTLIN}"',
        content,
    )
    
    for alias in ["agpVersion", "androidGradlePluginVersion", "gradlePluginVersion"]:
        content = re.sub(
            rf'{alias}\s*=\s*"[^"]*"',
            f'{alias} = "{TARGET_AGP}"',
            content,
        )
    
    if content != orig:
        write_file(toml_path, content)
        print(f"  ✓ Updated {toml_path}")

print("\n[Step 4] Update root build.gradle classpath")
root_build = "mobile/android/build.gradle"
if os.path.exists(root_build):
    content = read_file(root_build)
    orig = content
    
    content = re.sub(
        r'com\.android\.tools\.build:gradle:[0-9][0-9]*\.[0-9]+[\.0-9]*',
        f'com.android.tools.build:gradle:{TARGET_AGP}',
        content,
    )
    
    if content != orig:
        write_file(root_build, content)
        print(f"  ✓ Updated classpath to AGP {TARGET_AGP}")

print("\n[Step 5] Ensure gradle.properties has AndroidX settings")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""

if "android.useAndroidX=true" not in props_content:
    props_content += "\nandroid.useAndroidX=true\n"
if "android.enableJetifier=true" not in props_content:
    props_content += "android.enableJetifier=true\n"

write_file(props_path, props_content)
print("  ✓ Ensured AndroidX properties")

print("\n=== Verification ===")
settings = read_file(settings_path) or ""
if TARGET_AGP in settings:
    print(f"✓ settings.gradle contains AGP {TARGET_AGP}")

pm_check_start, pm_check_end = find_block(settings, "pluginManagement")
if pm_check_start >= 0:
    pm_block = settings[pm_check_start:pm_check_end]
    if "google()" in pm_block and "mavenCentral()" in pm_block:
        print("✓ pluginManagement block is valid")
    else:
        print("⚠ pluginManagement block may be malformed!")

pl_check_start, pl_check_end = find_block(settings, "plugins")
if pl_check_start >= 0:
    pl_block = settings[pl_check_start:pl_check_end]
    if TARGET_AGP in pl_block:
        print(f"✓ plugins block contains correct AGP version")
    else:
        print("⚠ plugins block missing correct AGP version!")
else:
    print("⚠ No plugins block found!")

for toml_path in toml_paths:
    toml_content = read_file(toml_path) or ""
    if TARGET_AGP in toml_content:
        print(f"✓ {os.path.basename(toml_path)} updated")

print("\n=== Fix script completed ===")