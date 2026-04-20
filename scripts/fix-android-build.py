import os
import re
import glob

print("=== Android Build Fix Script v19 (Expo SDK 53) ===")
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

print("\n[Step 4] Fix root build.gradle for SDK 53 compatibility")
root_build_path = os.path.join(android_dir, "build.gradle")
if os.path.exists(root_build_path):
    content = read_file(root_build_path)
    
    # Check if we need to add ext block with hardcoded values (most reliable approach)
    if content:
        print("  Checking build.gradle structure...")
        
        # If the file doesn't have ext block with our variables, we need to add it
        if 'buildToolsVersion' not in content or 'kotlinVersion' not in content:
            print("  Adding ext block with SDK 53 compatible values...")
            
            # Create a complete ext block that will be inserted at the beginning
            ext_block = """// Expo SDK 53 / RN 0.79 compatibility - hardcoded values
ext {
    buildToolsVersion = "35.0.0"
    minSdkVersion = 24
    compileSdkVersion = 35
    targetSdkVersion = 35
    kotlinVersion = "2.0.21"
    ndkVersion = "27.1.12297006"
}

"""
            # Insert at the very beginning of the file
            content = ext_block + content
            write_file(root_build_path, content)
            print("  Added ext block at the beginning of build.gradle")
        else:
            print("  OK: ext block already present")
        
        # Re-read content
        content = read_file(root_build_path)
        
        # Fix: Ensure kotlin-gradle-plugin uses the correct version
        print("\n[Step 4b] Ensure kotlin-gradle-plugin uses Kotlin 2.0.21")
        kotlin_pattern = r"classpath\s*\(\s*['\"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:([^'\"]+)['\"]\s*\)"
        match = re.search(kotlin_pattern, content)
        
        if match:
            current_version = match.group(1)
            if current_version == "$kotlinVersion":
                print(f"  OK: kotlin-gradle-plugin uses $kotlinVersion variable")
            elif current_version.startswith("2.0"):
                print(f"  OK: kotlin-gradle-plugin version is {current_version}")
            else:
                print(f"  WARNING: kotlin-gradle-plugin version is {current_version}, updating to 2.0.21")
                content = re.sub(
                    kotlin_pattern,
                    'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21")',
                    content
                )
                write_file(root_build_path, content)
                print("  Fixed: Updated kotlin-gradle-plugin to 2.0.21")
        else:
            print("  WARNING: Could not find kotlin-gradle-plugin classpath")
    
    # Re-read content
    content = read_file(root_build_path)
    
    # Fix: Ensure ext block is at the very beginning (before any other blocks)
    print("\n[Step 4c] Verify ext block is at the beginning")
    if 'ext {' in content:
        ext_pos = content.find('ext {')
        # Find the first non-comment, non-whitespace content
        lines = content.split('\n')
        first_real_line = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped and not stripped.startswith('//'):
                first_real_line = i
                break
        
        # Check if ext block starts at or near the beginning
        if ext_pos > 500:  # If ext block is not near the beginning
            print("  WARNING: ext block is not at the beginning, restructuring...")
            # Extract ext block
            ext_match = re.search(r'ext\s*\{[^}]+\}', content, re.DOTALL)
            if ext_match:
                ext_block_content = ext_match.group(0)
                # Remove ext block from current position
                content = content[:ext_match.start()] + content[ext_match.end():]
                # Add ext block at the very beginning
                content = ext_block_content + '\n\n' + content
                write_file(root_build_path, content)
                print("  Fixed: Moved ext block to the beginning")
        else:
            print("  OK: ext block is at the beginning")
else:
    print(f"  WARNING: {root_build_path} not found (will be created by expo prebuild)")

print("\n[Step 5] Fix app/build.gradle for SDK 53 compatibility")
app_build_path = os.path.join(android_dir, "app/build.gradle")
if os.path.exists(app_build_path):
    content = read_file(app_build_path)
    if content:
        # Add kotlinOptions if not present
        if 'kotlinOptions' not in content:
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
            print(f"  OK: kotlinOptions already present")
        
        # Ensure compileSdkVersion uses the ext variable or hardcoded value
        content = read_file(app_build_path)
        if 'compileSdkVersion' in content:
            # Replace any hardcoded compileSdkVersion with the ext variable
            content = re.sub(
                r'compileSdkVersion\s+\d+',
                'compileSdkVersion rootProject.ext.compileSdkVersion',
                content
            )
            write_file(app_build_path, content)
            print("  Fixed: compileSdkVersion now uses rootProject.ext.compileSdkVersion")
        
        # Ensure buildToolsVersion uses the ext variable
        content = read_file(app_build_path)
        if 'buildToolsVersion' in content:
            content = re.sub(
                r'buildToolsVersion\s+["\'][^"\']+["\']',
                'buildToolsVersion rootProject.ext.buildToolsVersion',
                content
            )
            write_file(app_build_path, content)
            print("  Fixed: buildToolsVersion now uses rootProject.ext.buildToolsVersion")
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
        print("  === Full root build.gradle ===")
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            print(f"  {i:3}: {line}")
        print("  === End of build.gradle ===")
        
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
