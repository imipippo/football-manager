import os
import re
import glob

print("=== Android Build Fix Script v17 (Expo SDK 53) ===")
print("Fixing expo-build-properties issue in SDK 53 bare workflow")
print("See: https://github.com/expo/expo/issues/36461")

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

android_dir = "mobile/android"

print("\n[Step 1] Verify android directory exists")
if not os.path.exists(android_dir):
    print(f"  ERROR: {android_dir} does not exist!")
    print("  This is expected if expo prebuild hasn't run yet.")
else:
    print(f"  OK: {android_dir} exists")

print("\n[Step 2] Ensure gradle.properties has required settings")
props_path = os.path.join(android_dir, "gradle.properties")
if os.path.exists(props_path):
    existing = read_file(props_path)
    props_lines = existing.split('\n') if existing else []
    props_keys = set()
    
    for line in props_lines:
        stripped = line.strip()
        if '=' in stripped and not stripped.startswith('#'):
            key = stripped.split('=')[0].strip()
            props_keys.add(key)
    
    required_props = {
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
    
    write_file(props_path, '\n'.join(props_lines) + '\n')
    print(f"  gradle.properties updated")
else:
    print(f"  WARNING: {props_path} not found (will be created by expo prebuild)")

print("\n[Step 3] Fix missing ext block in root build.gradle (SDK 53 bug workaround)")
root_build_path = os.path.join(android_dir, "build.gradle")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    
    ext_block = """ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')
        kotlinVersion = findProperty('android.kotlinVersion') ?: '2.0.21'
    }
"""
    
    if content and 'buildToolsVersion' not in content:
        buildscript_match = re.search(r'buildscript\s*\{', content)
        if buildscript_match:
            insert_pos = buildscript_match.end()
            content = content[:insert_pos] + '\n    ' + ext_block + content[insert_pos:]
            write_file(root_build_path, content)
            print(f"  Added ext block to root build.gradle after buildscript {{")
        else:
            print(f"  WARNING: Could not find buildscript block in root build.gradle")
    else:
        print(f"  OK: ext block already present in root build.gradle")
else:
    print(f"  WARNING: {root_build_path} not found (will be created by expo prebuild)")

print("\n[Step 4] Add kotlinOptions to app/build.gradle if needed")
app_build_path = os.path.join(android_dir, "app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)
    if content and 'kotlinOptions' not in content:
        android_match = re.search(r'(android\s*\{)', content)
        if android_match:
            insert_pos = android_match.end()
            kotlin_options = """
        kotlinOptions {
            jvmTarget = '17'
        }
"""
            content = content[:insert_pos] + kotlin_options + content[insert_pos:]
            write_file(app_build_path, content)
            print(f"  Added kotlinOptions to app/build.gradle")
    else:
        print(f"  OK: kotlinOptions already present or file not found")
else:
    print(f"  WARNING: {app_build_path} not found (will be created by expo prebuild)")

print("\n[Step 5] Verify settings.gradle has correct configuration")
settings_path = os.path.join(android_dir, "settings.gradle")
if os.path.exists(settings_path):
    content = read_file(settings_path)
    if content:
        print(f"  OK: settings.gradle exists")
        if 'apply from:' in content:
            print(f"  OK: apply from directives found")
else:
    print(f"  WARNING: {settings_path} not found")

print("\n[Step 6] Print root build.gradle for verification")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    if content:
        print("  === First 50 lines of root build.gradle ===")
        lines = content.split('\n')[:50]
        for i, line in enumerate(lines, 1):
            print(f"  {i:3}: {line}")
        print("  === End of preview ===")

print("\n=== Fix script completed ===")
print("Expo SDK 53 ext block bug has been worked around!")
