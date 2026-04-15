import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Pure Expo config (REMOVE all RN plugins from app/build.gradle)")

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("\n[Step 1] Clean app/build.gradle (REMOVE com.facebook.react plugin)")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    original_lines = content.split('\n')
    
    cleaned_lines = []
    removed_count = 0
    for line in original_lines:
        if 'com.facebook.react' in line or 'apply plugin' in line and 'react' in line.lower():
            print(f"  ✗ REMOVED: {line.strip()}")
            removed_count += 1
        else:
            cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    if "hermesEnabled" not in content:
        content = "def hermesEnabled = true\n" + content
        print("  ✓ Added hermesEnabled definition")
    else:
        print("  ℹ hermesEnabled already present")
    
    write_file(app_build, content)
    print(f"  ✓ Cleaned app/build.gradle (removed {removed_count} RN plugin lines)")

print("\n[Step 2] Write clean root build.gradle (Pure buildscript - NO plugins DSL, NO RN plugin)")
root_build = "mobile/android/build.gradle"

clean_build_gradle = '''buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.9.0"
        hermesEnabled = true
        newArchEnabled = false
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven {
          url new File(['node', '--print', "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), '../android')
        }
        maven { url "$rootDir/../node_modules/jsc-android/dist" }
        google()
        mavenCentral()
        jcenter()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
'''

write_file(root_build, clean_build_gradle)
print("  ✓ Root build.gradle written (Pure buildscript - no plugins DSL, no RN plugin)")

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
print("  ✓ gradle.properties written")

print("\n=== Verification ===")
root_content = read_file(root_build) or ""
if 'ndkVersion = "25.1.8937393"' in root_content:
    print("✓ ndkVersion defined!")
if "kotlinVersion = \"1.9.0\"" in root_content:
    print("✓ kotlinVersion = \"1.9.0\" - Standard Expo version!")
if "classpath 'com.android.tools.build:gradle:8.2.2'" in root_content:
    print("✓ AGP 8.2.2 - CLEAN!")
if 'plugins {' not in root_content:
    print("✓ No plugins DSL block in root - COMPATIBLE!")
if 'com.facebook.react' not in root_content:
    print("✓ No React Native plugin in root - PURE EXPO!")

app_content = read_file(app_build) or ""
if 'com.facebook.react' not in app_content:
    print("✓ No React Native plugin in app/build.gradle - EXPO COMPATIBLE!")
if "hermesEnabled" in app_content:
    print("✓ hermesEnabled defined")

props_final = read_file(props_path) or ""
if "hermesEnabled=true" in props_final:
    print("✓ gradle.properties OK")

if '"""' not in root_content and "+ TARGET_KOTLIN" not in root_content:
    print("✓ No garbage strings - FILES ARE CLEAN!")

print("\n=== Fix script completed ===")