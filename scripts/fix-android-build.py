import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: MINIMAL changes - preserve Expo prebuild output")

def read_file(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    return None

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def remove_lines_containing(content, patterns):
    """Remove lines containing any of the given patterns"""
    lines = content.split('\n')
    result = []
    removed = 0
    for line in lines:
        if any(pattern in line for pattern in patterns):
            print(f"  ✗ REMOVED: {line.strip()}")
            removed += 1
        else:
            result.append(line)
    return '\n'.join(result), removed

def remove_react_block(content):
    """Remove react { ... } configuration block"""
    lines = content.split('\n')
    result = []
    in_react_block = False
    brace_count = 0
    removed = 0
    
    for line in lines:
        stripped = line.strip()
        
        if re.match(r'^react\s*\{', stripped) and not in_react_block:
            in_react_block = True
            brace_count = stripped.count('{') - stripped.count('}')
            print(f"  ✗ REMOVED: react {{ ... }} block")
            removed += 1
            continue
        
        if in_react_block:
            brace_count += stripped.count('{') - stripped.count('}')
            if brace_count <= 0:
                in_react_block = False
            continue
        
        result.append(line)
    
    return '\n'.join(result), removed

print("\n[Step 1] Clean app/build.gradle (MINIMAL changes only)")
app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    content = read_file(app_build)
    
    # Remove React Native plugin/dependency references
    rn_patterns = [
        'com.facebook.react',
        'react-android',
        'react-native',
        "apply plugin.*react",
        "id 'com.facebook.react'",
    ]
    content, rn_removed = remove_lines_containing(content, rn_patterns)
    
    # Remove react { ... } configuration block
    content, react_removed = remove_react_block(content)
    
    # Ensure hermesEnabled is defined at the top
    if "hermesEnabled" not in content:
        content = "def hermesEnabled = true\n" + content
        print("  ✓ Added hermesEnabled definition")
    else:
        print("  ℹ hermesEnabled already present")
    
    write_file(app_build, content)
    total_removed = rn_removed + react_removed
    if total_removed > 0:
        print(f"  ✓ Cleaned app/build.gradle (removed {total_removed} RN-related lines)")
    else:
        print("  ✓ app/build.gradle already clean (no changes needed)")

print("\n[Step 2] DO NOT modify root build.gradle (preserve Expo prebuild output)")
root_build = "mobile/android/build.gradle"
if os.path.exists(root_build):
    content = read_file(root_build)
    
    # Only check, don't modify
    has_rn_plugin = 'com.facebook.react' in content
    has_plugins_dsl = 'plugins {' in content
    
    if has_rn_plugin or has_plugins_dsl:
        print(f"  ⚠ Root build.gradle contains potential issues:")
        if has_rn_plugin:
            print("     - Contains com.facebook.react reference")
        if has_plugins_dsl:
            print("     - Contains plugins {} block")
        print("  ℹ Preserving Expo prebuild output as-is")
    else:
        print("  ✓ Root build.gradle looks good (Expo standard)")

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
app_content = read_file(app_build) or ""
if 'com.facebook.react' not in app_content:
    print("✓ No com.facebook.react in app/build.gradle")
if 'react-android' not in app_content:
    print("✓ No react-android dependency in app/build.gradle")
if 'react {' not in app_content and 'react{' not in app_content:
    print("✓ No react {} block in app/build.gradle")
if "hermesEnabled" in app_content:
    print("✓ hermesEnabled defined in app/build.gradle")

props_final = read_file(props_path) or ""
if "hermesEnabled=true" in props_final:
    print("✓ gradle.properties OK")

print("\n=== Fix script completed ===")
print("ℹ Key principle: Preserve Expo prebuild output, only remove RN-specific code")