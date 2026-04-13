import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Force override AGP version via pluginManagement + direct file writes")

TARGET_AGP = "8.7.0"
TARGET_KOTLIN = "1.9.22"

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

print("\n[Step 2] Force AGP version via settings.gradle pluginManagement")
settings_path = "mobile/android/settings.gradle"
if os.path.exists(settings_path):
    content = read_file(settings_path)
    
    plugin_mgmt_block = f"""pluginManagement {{
    repositories {{
        google()
        mavenCentral()
        gradlePluginPortal()
    }}
}}
"""
    
    if "pluginManagement" not in content:
        content = plugin_mgmt_block + "\n" + content
        print("  ✓ Added pluginManagement block to settings.gradle")
    else:
        content = re.sub(
            r'pluginManagement\s*\{[^}]*\}',
            plugin_mgmt_block.strip(),
            content,
            count=1,
            flags=re.DOTALL,
        )
        print("  ✓ Replaced existing pluginManagement block")
    
    plugins_block_match = re.search(
        r'plugins\s*\{',
        content,
    )
    
    if plugins_block_match:
        start = plugins_block_match.start()
        brace_count = 0
        end = start
        for i in range(start, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        
        new_plugins_block = f"""plugins {{
    id("com.android.application") version "{TARGET_AGP}" apply false
    id("com.android.library") version "{TARGET_AGP}" apply false
    id("org.jetbrains.kotlin.android") version "{TARGET_KOTLIN}" apply false
}}"""
        
        content = content[:start] + new_plugins_block + content[end:]
        print(f"  ✓ Set AGP version to {TARGET_AGP} in plugins block")
    else:
        new_plugins_block = f"""
plugins {{
    id("com.android.application") version "{TARGET_AGP}" apply false
    id("com.android.library") version "{TARGET_AGP}" apply false
    id("org.jetbrains.kotlin.android") version "{TARGET_KOTLIN}" apply false
}}
"""
        insert_pos = content.find("\n", content.find("}")) if "}" in content else len(content)
        if insert_pos > 0:
            content = content[:insert_pos] + new_plugins_block + content[insert_pos:]
            print(f"  ✓ Added plugins block with AGP {TARGET_AGP}")
    
    write_file(settings_path, content)
else:
    print(f"  ✗ {settings_path} not found!")

print("\n[Step 3] Override libs.versions.toml if exists")
toml_paths = []
for root, dirs, files in os.walk("mobile/android"):
    for f in files:
        if f.endswith(".toml"):
            toml_paths.append(os.path.join(root, f))

for toml_path in toml_paths:
    content = read_file(toml_path)
    orig = content
    
    content = re.sub(
        r'(agp|androidGradlePlugin)\s*=\s*"[^"]*"',
        f'\\1 = "{TARGET_AGP}"',
        content,
    )
    
    content = re.sub(
        r'(kotlin|kotlinAndroid)\s*=\s*"[^"]*"',
        f'\\1 = "{TARGET_KOTLIN}"',
        content,
    )
    
    version_aliases = ["agpVersion", "androidGradlePluginVersion", "gradlePluginVersion"]
    for alias in version_aliases:
        content = re.sub(
            rf'{alias}\s*=\s*"[^"]*"',
            f'{alias} = "{TARGET_AGP}"',
            content,
        )
    
    if content != orig:
        write_file(toml_path, content)
        print(f"  ✓ Updated {toml_path}")

print("\n[Step 4] Check and update build.gradle classpath")
root_build = "mobile/android/build.gradle"
if os.path.exists(root_build):
    content = read_file(root_build)
    orig = content
    
    content = re.sub(
        r'com\.android\.tools\.build:gradle:[0-9][0-9]*\.[0-9]+[\.0-9]*',
        f'com.android.tools.build:gradle:{TARGET_AGP}',
        content,
    )
    
    if content != orig:
        write_file(root_build, content)
        print(f"  ✓ Updated classpath in build.gradle")

print("\n[Step 5] Create/update gradle.properties for safety")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""
    
if "android.useAndroidX=true" not in props_content:
    props_content += "\nandroid.useAndroidX=true\n"
if "android.enableJetifier=true" not in props_content:
    props_content += "android.enableJetifier=true\n"

write_file(props_path, props_content)
print("  ✓ Ensured AndroidX properties in gradle.properties")

print("\n=== Verification ===")
settings = read_file(settings_path) or ""
if TARGET_AGP in settings:
    print(f"✓ settings.gradle contains AGP {TARGET_AGP}")
else:
    print(f"✗ WARNING: AGP {TARGET_AGP} NOT found in settings.gradle!")

for toml_path in toml_paths:
    toml_content = read_file(toml_path) or ""
    if TARGET_AGP in toml_content:
        print(f"✓ {toml_path} contains AGP {TARGET_AGP}")

root_content = read_file(root_build) or ""
if TARGET_AGP in root_content:
    print(f"✓ build.gradle contains AGP {TARGET_AGP}")

print("\n=== Fix script completed ===")