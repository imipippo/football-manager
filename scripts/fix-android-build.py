import os
import re

print("=== Starting Android build fix script ===")
print("Strategy: Complete settings.gradle rewrite with verified template")

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

print("\n[Step 2] Extract info and rebuild settings.gradle")
settings_path = "mobile/android/settings.gradle"
original_settings = read_file(settings_path) or ""

project_name_match = re.search(r'rootProject\.name\s*=\s*["\']([^"\']+)["\']', original_settings)
root_project_name = project_name_match.group(1) if project_name_match else "football-manager"

includes = re.findall(r'^\s*include\s*[\'"]([^\'"]+)[\'"]', original_settings, re.MULTILINE)
if not includes:
    includes = [":app"]

print(f"  Project name: {root_project_name}")
print(f"  Includes: {includes}")

new_settings = f"""pluginManagement {{
    repositories {{
        google()
        mavenCentral()
        gradlePluginPortal()
    }}
}}

plugins {{
    id("com.android.application") version "{TARGET_AGP}" apply false
    id("com.android.library") version "{TARGET_AGP}" apply false
    id("org.jetbrains.kotlin.android") version "{TARGET_KOTLIN}" apply false
}}

dependencyResolutionManagement {{
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {{
        google()
        mavenCentral()
    }}
}}

rootProject.name = "{root_project_name}"
"""

for inc in includes:
    new_settings += f'include "{inc}"\n'

write_file(settings_path, new_settings)
print("  ✓ Rebuilt settings.gradle with standard template")

print("\n[Step 3] Override .toml files")
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
    
    for alias in ["agpVersion", "androidGradlePluginVersion", "gradlePluginVersion"]:
        content = re.sub(
            rf'{alias}\s*=\s*"[^"]*"',
            f'{alias} = "{TARGET_AGP}"',
            content,
        )
    
    if content != orig:
        write_file(toml_path, content)
        print(f"  ✓ Updated {os.path.basename(toml_path)}")

print("\n[Step 4] Update root build.gradle classpath")
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
        print(f"  ✓ Updated classpath to AGP {TARGET_AGP}")

print("\n[Step 5] Ensure gradle.properties has AndroidX settings")
props_path = "mobile/android/gradle.properties"
props_content = read_file(props_path) or ""

if "android.useAndroidX=true" not in props_content:
    props_content += "\nandroid.useAndroidX=true\n"
if "android.enableJetifier=true" not in props_content:
    props_content += "android.enableJetifier=true\n"

write_file(props_path, props_content)
print("  ✓ Ensured AndroidX properties")

print("\n=== Verification ===")
final_settings = read_file(settings_path) or ""
print("--- Final settings.gradle ---")
for i, line in enumerate(final_settings.split("\n")[:20], 1):
    print(f"  {i:2d}: {line}")
print("...")

if TARGET_AGP in final_settings:
    print(f"✓ AGP {TARGET_AGP} present in settings.gradle")
else:
    print(f"✗ WARNING: AGP {TARGET_AGP} NOT found!")

if 'pluginManagement {' in final_settings and 'plugins {' in final_settings:
    print("✓ Required blocks present")

print("\n=== Fix script completed ===")