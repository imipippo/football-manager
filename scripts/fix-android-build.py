import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Complete compatibility fix with hermesEnabled defined")

TARGET_AGP = "8.6.0"
TARGET_KOTLIN = "1.9.20"
TARGET_RN_GRADLE_PLUGIN = "0.75.4"

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("\n[Step 1] Ensure hermesEnabled is defined in app/build.gradle")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    
    if "hermesEnabled" not in content:
        content = "def hermesEnabled = true\n" + content
        print("  ✓ Added hermesEnabled definition")
    else:
        print("  ℹ hermesEnabled already present")
    
    write_file(app_build, content)

print("\n[Step 2] Fix build.gradle classpath + ext versions")
root_build = "mobile/android/build.gradle"
if os.path.exists(root_build):
    content = read_file(root_build)
    
    content = re.sub(
        r'com\.android\.tools\.build:gradle:[^"]*"',
        f'com.android.tools.build:gradle:{TARGET_AGP}',
        content,
    )
    
    content = re.sub(
        r'com\.facebook\.react:react-native-gradle-plugin:[^"]*"',
        f'com.facebook.react:react-native-gradle-plugin:{TARGET_RN_GRADLE_PLUGIN}',
        content,
    )
    
    content = re.sub(
        r'org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"]*"',
        f'org.jetbrains.kotlin:kotlin-gradle-plugin:{TARGET_KOTLIN}',
        content,
    )
    
    kotlin_version_patterns = [
        (r'kotlin_version\s*=\s*"[^"]*"', f'kotlin_version = "{TARGET_KOTLIN}"'),
        (r'kotlinVersion\s*=\s*"[^"]*"', f'kotlinVersion = "{TARGET_KOTLIN}"'),
        (r'KOTLIN_VERSION\s*=\s*"[^"]*"', f'KOTLIN_VERSION = "{TARGET_KOTLIN}"'),
    ]
    for pattern, replacement in kotlin_version_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            print(f"  ✓ Updated Kotlin version to {TARGET_KOTLIN}")
            break
    
    if "hermesEnabled" not in content and "ext {" in content:
        content = re.sub(
            r'(ext\s*\{)',
            r'\1\n    hermesEnabled = true',
            content,
            count=1,
        )
        print("  ✓ Added hermesEnabled to ext block")
    
    write_file(root_build, content)
    print(f"  ✓ AGP: {TARGET_AGP}, Kotlin: {TARGET_KOTLIN}")

print("\n[Step 3] Configure gradle.properties (clean overwrite)")
props_path = "mobile/android/gradle.properties"

final_props = """android.useAndroidX=true
android.enableJetifier=true
hermesEnabled=true
org.gradle.jvmargs=-Xmx4608m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8
org.gradle.daemon=false
org.gradle.parallel=true
org.gradle.caching=true
"""

write_file(props_path, final_props.strip() + "\n")
print("  ✓ gradle.properties written with hermesEnabled=true")

print("\n=== Verification ===")
root_content = read_file(root_build) or ""
if TARGET_KOTLIN in root_content:
    print(f"✓ Kotlin {TARGET_KOTLIN} configured")
if TARGET_AGP in root_content:
    print(f"✓ AGP {TARGET_AGP} configured")

app_content = read_file(app_build) or ""
if "hermesEnabled" in app_content:
    print("✓ hermesEnabled defined in app/build.gradle")

props_final = read_file(props_path) or ""
if "hermesEnabled=true" in props_final:
    print("✓ hermesEnabled=true in gradle.properties")

print("\n=== Fix script completed ===")