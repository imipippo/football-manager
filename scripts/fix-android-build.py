import os

print("=== Starting Android build fix script ===")
print("Strategy: Clean build.gradle replacement (no more hacks)")

TARGET_AGP = "8.3.0"
TARGET_KOTLIN = "1.9.20"
TARGET_RN_GRADLE_PLUGIN = "0.75.0"

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

print("\n[Step 2] Write clean build.gradle")
root_build = "mobile/android/build.gradle"

clean_build_gradle = """buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = """ + TARGET_KOTLIN + """
        hermesEnabled = true
        newArchEnabled = false
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:""" + TARGET_AGP + """'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}

plugins {
    id "com.facebook.react.rootproject" version "0.75.0"
}

allprojects {
    repositories {
        mavenLocal()
        maven { url("$rootDir/../node_modules/react-native/android") }
        maven { url("$rootDir/../node_modules/jsc-android/dist") }
        google()
        mavenCentral()
        jcenter()
    }
}

subprojects {
    project.configurations.all {
        resolutionStrategy.eachDependency { details ->
            if (details.requested.group == 'org.jetbrains.kotlin' && !details.requested.name.contains('gradle')) {
                details.useVersion '"" + TARGET_KOTLIN + "'"
            }
        }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
"""

write_file(root_build, clean_build_gradle)
print("  ✓ build.gradle written (clean template)")

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
if TARGET_KOTLIN in root_content:
    print(f"✓ Kotlin {TARGET_KOTLIN} in build.gradle")
if TARGET_AGP in root_content:
    print(f"✓ AGP {TARGET_AGP} in build.gradle")
if "eachDependency" in root_content:
    print("✓ Safe Kotlin version force (no afterEvaluate)")
if "hermesEnabled = true" in root_content:
    print("✓ hermesEnabled defined")

app_content = read_file(app_build) or ""
if "hermesEnabled" in app_content:
    print("✓ hermesEnabled in app/build.gradle")

print("\n=== Fix script completed ===")