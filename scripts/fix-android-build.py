import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Complete compatibility fix")

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

print("\n[Step 1] Fix hermesEnabled in app/build.gradle")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    lines = content.split("\n")
    filtered = [l for l in lines if not (l.strip().startswith("hermesEnabled") and "=" in l)]
    write_file(app_build, "\n".join(filtered))
    print("  ✓ Removed hermesEnabled from wrong location")

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
    
    write_file(root_build, content)
    print(f"  ✓ AGP: {TARGET_AGP}, Kotlin: {TARGET_KOTLIN}")

print("\n[Step 3] Add subprojects Kotlin compatibility block")
subprojects_block = """

subprojects {
    afterEvaluate {
        if (project.plugins.hasPlugin("kotlin-android")) {
            kotlin {
                jvmToolchain(17)
            }
            tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
                kotlinOptions {
                    jvmTarget = "17"
                    freeCompilerArgs += [
                        "-Xsuppress-version-warnings",
                        "-Xskip-prerelease-check",
                        "-Xjsr305=strict"
                    ]
                }
            }
        }
    }
}
"""

if os.path.exists(root_build):
    content = read_file(root_build)
    if "jvmToolchain(17)" not in content:
        content = content.rstrip() + subprojects_block
        write_file(root_build, content)
        print("  ✓ Added Kotlin compatibility block")
    else:
        print("  ℹ Kotlin compatibility block already exists")

print("\n[Step 4] Configure gradle.properties")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""

props_to_add = {
    "org.gradle.jvmargs": "-Xmx4608m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8",
    "org.gradle.daemon": "false",
    "org.gradle.parallel": "true",
    "android.useAndroidX": "true",
    "android.enableJetifier": "true",
}

for key, value in props_to_add.items():
    pattern = rf'^{re.escape(key)}=.*$'
    if not re.search(pattern, props_content, re.MULTILINE):
        props_content += f"\n{key}={value}"

write_file(props_path, props_content)
print("  ✓ gradle.properties configured")

print("\n=== Verification ===")
root_content = read_file(root_build) or ""
if TARGET_KOTLIN in root_content:
    print(f"✓ Kotlin {TARGET_KOTLIN} configured")
if TARGET_AGP in root_content:
    print(f"✓ AGP {TARGET_AGP} configured")
if "jvmToolchain(17)" in root_content:
    print("✓ Kotlin compatibility block added")

print("\n=== Fix script completed ===")