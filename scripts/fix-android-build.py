import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Fix version compatibility issues")

TARGET_AGP = "8.6.0"
TARGET_KOTLIN = "1.9.25"
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

print("\n[Step 2] Fix build.gradle classpath versions")
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
    
    kotlin_version_match = re.search(r'kotlin_version\s*=\s*"[^"]*"', content)
    if kotlin_version_match:
        content = re.sub(
            r'kotlin_version\s*=\s*"[^"]*"',
            f'kotlin_version = "{TARGET_KOTLIN}"',
            content,
        )
    
    if content != orig:
        write_file(root_build, content)
        print(f"  ✓ Updated build.gradle:")
        print(f"    - AGP: {TARGET_AGP}")
        print(f"    - Kotlin: {TARGET_KOTLIN}")
        print(f"    - RN Gradle Plugin: {TARGET_RN_GRADLE_PLUGIN}")

print("\n[Step 3] Configure gradle.properties for compatibility")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""

props_to_add = {
    "org.gradle.jvmargs": "-Xmx4608m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8",
    "org.gradle.daemon": "false",
    "org.gradle.parallel": "true",
    "android.useAndroidX": "true",
    "android.enableJetifier": "true",
    "android.suppressUnsupportedCompileSdk": "35",
    "android.composeCompiler.suppressKotlinVersionCompatibilityCheck": "true",
}

for key, value in props_to_add.items():
    pattern = rf'^{re.escape(key)}=.*$'
    if not re.search(pattern, props_content, re.MULTILINE):
        props_content += f"\n{key}={value}"
        print(f"  ✓ Added {key}")
    else:
        props_content = re.sub(pattern, f"{key}={value}", props_content, flags=re.MULTILINE)

write_file(props_path, props_content)
print("  ✓ gradle.properties configured")

print("\n=== Verification ===")
root_content = read_file(root_build) or ""
if TARGET_AGP in root_content:
    print(f"✓ AGP {TARGET_AGP} in build.gradle")
if TARGET_KOTLIN in root_content:
    print(f"✓ Kotlin {TARGET_KOTLIN} in build.gradle")

props_final = read_file(props_path) or ""
if "suppressKotlinVersionCompatibilityCheck=true" in props_final:
    print("✓ Kotlin compatibility check suppressed")
if "4608m" in props_final:
    print("✓ Memory increased to 4608m")

print("\n=== Fix script completed ===")