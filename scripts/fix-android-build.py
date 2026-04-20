import os
import re
import glob

print("=== Android Build Fix Script v15 (Expo SDK 53) ===")
print("Expo SDK 53 natively supports Kotlin 2.x - minimal fixes needed")

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

print("\n[Step 3] Add kotlinOptions to app/build.gradle if needed")
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

print("\n=== Fix script completed ===")
print("Expo SDK 53 should handle Kotlin 2.x natively!")
