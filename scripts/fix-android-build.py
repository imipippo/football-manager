import os

print("=== Starting Android build fix script ===")
print("Strategy: Pure standard Expo native config (NO React Native plugin conflicts)")

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

print("\n[Step 2] Write clean build.gradle (Pure Expo Standard Config)")
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

plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'com.android.library' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.0' apply false
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
print("  ✓ build.gradle written (Pure Expo Standard Config)")

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
if "id 'com.android.application'" in root_content:
    print("✓ Standard plugins block - CLEAN!")
if "id 'org.jetbrains.kotlin.android'" in root_content:
    print("✓ Kotlin plugin in plugins block - CLEAN!")
if 'com.facebook.react' not in root_content:
    print("✓ No React Native plugin conflict - PURE EXPO!")
if '"""' not in root_content and "+ TARGET_KOTLIN" not in root_content:
    print("✓ No garbage strings - FILE IS CLEAN!")

app_content = read_file(app_build) or ""
if "hermesEnabled" in app_content:
    print("✓ hermesEnabled defined")

props_final = read_file(props_path) or ""
if "hermesEnabled=true" in props_final:
    print("✓ gradle.properties OK")

print("\n=== Fix script completed ===")