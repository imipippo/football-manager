import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: MINIMAL - only fix build.gradle classpath, leave everything else unchanged")

TARGET_AGP = "8.7.0"
TARGET_KOTLIN = "1.9.22"
TARGET_RN_GRADLE_PLUGIN = "0.75.4"

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("\n[Step 1] Fix hermesEnabled in app/build.gradle")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    lines = content.split("\n")
    filtered = [l for l in lines if not (l.strip().startswith("hermesEnabled") and "=" in l)]
    write_file(app_build, "\n".join(filtered))
    print("  ✓ Removed hermesEnabled from wrong location")

print("\n[Step 2] Fix build.gradle classpath with hardcoded versions")
root_build = "mobile/android/build.gradle"
if os.path.exists(root_build):
    content = read_file(root_build)
    orig = content
    
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
    
    if content != orig:
        write_file(root_build, content)
        print(f"  ✓ Updated build.gradle classpath:")
        print(f"    - AGP: {TARGET_AGP}")
        print(f"    - Kotlin: {TARGET_KOTLIN}")
        print(f"    - RN Gradle Plugin: {TARGET_RN_GRADLE_PLUGIN}")
    else:
        print("  ℹ build.gradle classpath already has correct versions")

print("\n[Step 3] Ensure gradle.properties has AndroidX settings")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""

if "android.useAndroidX=true" not in props_content:
    props_content += "\nandroid.useAndroidX=true\n"
if "android.enableJetifier=true" not in props_content:
    props_content += "android.enableJetifier=true\n"

write_file(props_path, props_content)
print("  ✓ Ensured AndroidX properties")

print("\n=== Verification ===")

root_content = read_file(root_build) or ""
if TARGET_AGP in root_content:
    print(f"✓ build.gradle contains AGP {TARGET_AGP}")
else:
    print(f"✗ WARNING: AGP {TARGET_AGP} NOT found in build.gradle!")

if TARGET_KOTLIN in root_content:
    print(f"✓ build.gradle contains Kotlin {TARGET_KOTLIN}")
else:
    print(f"✗ WARNING: Kotlin {TARGET_KOTLIN} NOT found in build.gradle!")

if TARGET_RN_GRADLE_PLUGIN in root_content:
    print(f"✓ build.gradle contains RN Gradle Plugin {TARGET_RN_GRADLE_PLUGIN}")
else:
    print(f"✗ WARNING: RN Gradle Plugin {TARGET_RN_GRADLE_PLUGIN} NOT found in build.gradle!")

print("\n=== Fix script completed ===")