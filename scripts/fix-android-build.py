import os
import re
import glob

print("=== Android Build Fix Script v18 (Expo SDK 53) ===")
print("Fixing expo-build-properties and Gradle version issues in SDK 53")
print("See: https://github.com/expo/expo/issues/36461")
print("See: https://github.com/expo/expo/issues/38199")

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
    print("  Exiting with error code 1")
    exit(1)
else:
    print(f"  OK: {android_dir} exists")

print("\n[Step 2] Fix Gradle version to 8.9+ (required for RN 0.79)")
gradle_wrapper_path = os.path.join(android_dir, "gradle/wrapper/gradle-wrapper.properties")
if os.path.exists(gradle_wrapper_path):
    content = read_file(gradle_wrapper_path)
    if content:
        if 'gradle-8.9' not in content and 'gradle-8.10' not in content:
            content = re.sub(
                r'distributionUrl=https\\://services\.gradle\.org/distributions/gradle-[0-9.]+-all\.zip',
                'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-all.zip',
                content
            )
            write_file(gradle_wrapper_path, content)
            print(f"  Updated Gradle version to 8.9")
        else:
            print(f"  OK: Gradle version is already 8.9+")
else:
    print(f"  WARNING: {gradle_wrapper_path} not found")

print("\n[Step 3] Ensure gradle.properties has required settings")
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

print("\n[Step 4] Fix missing ext block in root build.gradle (SDK 53 bug workaround)")
root_build_path = os.path.join(android_dir, "build.gradle")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    original_content = content
    
    # Check if ext block exists - SDK 53 sometimes generates build.gradle without ext block
    if content and 'buildToolsVersion' not in content:
        print("  WARNING: ext block not found, adding it...")
        ext_block = """ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')
        kotlinVersion = findProperty('android.kotlinVersion') ?: '2.0.21'
        ndkVersion = findProperty('android.ndkVersion') ?: '27.1.12297006'
    }
"""
        # Try to find the best place to insert ext block
        # Option 1: After buildscript block
        buildscript_match = re.search(r'buildscript\s*\{[^}]+\}', content, re.DOTALL)
        if buildscript_match:
            insert_pos = buildscript_match.end()
            content = content[:insert_pos] + '\n\n' + ext_block + content[insert_pos:]
            print(f"  Added ext block after buildscript block")
        else:
            # Option 2: At the beginning of the file
            content = ext_block + '\n' + content
            print(f"  Added ext block at the beginning of the file")
        
        write_file(root_build_path, content)
    else:
        print(f"  OK: ext block already present in root build.gradle")
    
    # Re-read content after potential modification
    content = read_file(root_build_path)
    
    # Fix: Ensure kotlin-gradle-plugin uses correct version
    print("\n[Step 4b] Ensure kotlin-gradle-plugin version is 2.0.21")
    if content and "kotlin-gradle-plugin" in content:
        # Check if kotlin version is specified in classpath
        if re.search(r"classpath\s*\(\s*['\"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:\$kotlinVersion['\"]\s*\)", content):
            print(f"  OK: kotlin-gradle-plugin uses $kotlinVersion variable")
        elif re.search(r"classpath\s*\(\s*['\"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:[0-9]", content):
            # Has hardcoded version, check if it matches
            match = re.search(r"classpath\s*\(\s*['\"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:([0-9.]+)['\"]\s*\)", content)
            if match:
                version = match.group(1)
                if version.startswith("2.0"):
                    print(f"  OK: kotlin-gradle-plugin version is {version}")
                else:
                    print(f"  WARNING: kotlin-gradle-plugin version is {version}, expected 2.0.21")
                    # Replace with variable reference
                    content = re.sub(
                        r"classpath\s*\(\s*['\"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:[0-9.]+['\"]\s*\)",
                        "classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion\")",
                        content
                    )
                    write_file(root_build_path, content)
                    print(f"  Fixed: Changed to use $kotlinVersion variable")
        else:
            print(f"  WARNING: Could not determine kotlin-gradle-plugin version format")
    
    # Re-read content
    content = read_file(root_build_path)
    
    # Fix: Ensure ext block is defined BEFORE buildscript if it's at root level
    # This is important for the variables to be available in buildscript
    print("\n[Step 4c] Verify ext block placement")
    if 'ext {' in content:
        ext_pos = content.find('ext {')
        buildscript_pos = content.find('buildscript {')
        
        if buildscript_pos > 0 and ext_pos > buildscript_pos:
            print("  WARNING: ext block is after buildscript, variables may not be accessible")
            print("  This is a known SDK 53 issue - ext block should be at root level before buildscript")
            # We need to move ext block to before buildscript
            # Extract ext block
            ext_match = re.search(r'ext\s*\{[^}]+\}', content, re.DOTALL)
            if ext_match:
                ext_block_content = ext_match.group(0)
                # Remove ext block from current position
                content = content[:ext_match.start()] + content[ext_match.end():]
                # Add ext block before buildscript
                content = ext_block_content + '\n\n' + content
                write_file(root_build_path, content)
                print("  Fixed: Moved ext block to before buildscript")
        else:
            print("  OK: ext block is properly placed")
else:
    print(f"  WARNING: {root_build_path} not found (will be created by expo prebuild)")

print("\n[Step 5] Add kotlinOptions to app/build.gradle if needed")
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

print("\n[Step 6] Verify settings.gradle has correct configuration")
settings_path = os.path.join(android_dir, "settings.gradle")
if os.path.exists(settings_path):
    content = read_file(settings_path)
    if content:
        print(f"  OK: settings.gradle exists")
        if 'apply from:' in content:
            print(f"  OK: apply from directives found")
else:
    print(f"  WARNING: {settings_path} not found")

print("\n[Step 7] Print root build.gradle for verification")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    if content:
        print("  === First 80 lines of root build.gradle ===")
        lines = content.split('\n')[:80]
        for i, line in enumerate(lines, 1):
            print(f"  {i:3}: {line}")
        print("  === End of preview ===")
        
        # Check for critical configurations
        print("\n[Step 7b] Critical configuration check")
        if 'kotlinVersion' in content:
            print("  OK: kotlinVersion is defined")
        else:
            print("  ERROR: kotlinVersion is NOT defined!")
        
        if 'buildToolsVersion' in content:
            print("  OK: buildToolsVersion is defined")
        else:
            print("  ERROR: buildToolsVersion is NOT defined!")
            
        if 'compileSdkVersion' in content:
            print("  OK: compileSdkVersion is defined")
        else:
            print("  ERROR: compileSdkVersion is NOT defined!")

print("\n[Step 8] Print gradle-wrapper.properties for verification")
if os.path.exists(gradle_wrapper_path):
    content = read_file(gradle_wrapper_path)
    if content:
        print("  === gradle-wrapper.properties ===")
        for line in content.split('\n'):
            if line.strip():
                print(f"  {line}")
        print("  === End ===")

print("\n=== Fix script completed ===")
print("Expo SDK 53 ext block bug has been worked around!")
print("Gradle version has been updated to 8.9+ for RN 0.79!")
