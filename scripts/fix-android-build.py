import re
import os
import glob

print("=== Starting Android build fix script ===")
print("Target: Upgrade AGP to 8.7.0 to support androidx.core:1.16.0")

TARGET_AGP_VERSION = "8.7.0"

app_build = "mobile/android/app/build.gradle"
if os.path.exists(app_build):
    with open(app_build, "r") as f:
        c = f.read()
    lines = [l for l in c.split("\n") if not (l.strip().startswith("hermesEnabled") and "=" in l)]
    with open(app_build, "w") as f:
        f.write("\n".join(lines))
    print("✓ Fix1: Removed hermesEnabled from wrong location")
else:
    print(f"Warning: {app_build} not found")

print("\n--- Searching for AGP version definitions ---")

all_gradle_files = []
all_gradle_files.extend(glob.glob("mobile/android/**/*.gradle", recursive=True))
all_gradle_files.extend(glob.glob("mobile/android/**/*.gradle.kts", recursive=True))
all_gradle_files.extend(glob.glob("mobile/android/**/libs.versions.toml", recursive=True))
all_gradle_files.extend(glob.glob("mobile/android/**/*.toml", recursive=True))
all_gradle_files.append("mobile/android/settings.gradle")
all_gradle_files.append("mobile/android/build.gradle")

all_gradle_files = list(set(all_gradle_files))

agp_upgraded = False

for fp in all_gradle_files:
    if not os.path.exists(fp):
        continue
    
    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    orig = content
    
    patterns = [
        (r'com\.android\.tools\.build:gradle:[0-9][0-9]*\.[0-9]+[\.0-9]*', 
         f'com.android.tools.build:gradle:{TARGET_AGP_VERSION}'),
        
        (r'id\(\s*"com\.android\.application"\s*\)\s+version\s+"[0-9][0-9]*\.[0-9]+"',
         f'id("com.android.application") version "{TARGET_AGP_VERSION}"'),
        
        (r"id\(\s*'com\.android\.application'\s*\)\s+version\s+'[0-9][0-9]*\.[0-9]+'",
         f"id('com.android.application') version '{TARGET_AGP_VERSION}'"),
        
        (r'(?:agp|androidGradlePlugin|androidGradle|gradlePlugin)\s*=\s*"[0-9][0-9]*\.[0-9]+"',
         lambda m: re.sub(r'[0-9][0-9]*\.[0-9]+', TARGET_AGP_VERSION, m.group(0))),
        
        (r'"[0-9][0-9]*\.[0-9]+"\s*#\s*AGP\s*version',
         lambda m: re.sub(r'[0-9][0-9]*\.[0-9]+', TARGET_AGP_VERSION, m.group(0))),
        
        (r'kotlin\(\s*"com\.android\.application"\s*\)\s*version\s*"[0-9][0-9]*\.[0-9]+"',
         f'kotlin("com.android.application") version "{TARGET_AGP_VERSION}"'),
        
        (r'version\s*=\s*"[0-9][0-9]*\.[0-9]+"\s*(?:#|//)?\s*(?:AGP|androidGradle)',
         lambda m: re.sub(r'[0-9][0-9]*\.[0-9]+', TARGET_AGP_VERSION, m.group(0))),
    ]
    
    for pattern, replacement in patterns:
        if callable(replacement):
            content = re.sub(pattern, replacement, content)
        else:
            content = re.sub(pattern, replacement, content)
    
    if content != orig:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✓ AGP upgraded in: {fp}")
        agp_upgraded = True

if agp_upgraded:
    print(f"\n✓ Successfully upgraded AGP to {TARGET_AGP_VERSION}")
else:
    print(f"\n⚠ No AGP version found in standard locations, adding pluginManagement...")
    
    sf = "mobile/android/settings.gradle"
    if os.path.exists(sf):
        with open(sf) as f:
            content = f.read()
        
        if "pluginManagement" not in content:
            pm = f"""pluginManagement {{
  repositories {{
    google()
    mavenCentral()
    gradlePluginPortal()
  }}
}}

plugins {{
  id("com.android.application") version "{TARGET_AGP_VERSION}" apply false
  id("com.android.library") version "{TARGET_AGP_VERSION}" apply false
  id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}}
"""
            lines = content.split("\n")
            
            plugin_def_start = -1
            for i, line in enumerate(lines):
                if "id(\"com.android.application\")" in line or "id('com.android.application')" in line:
                    plugin_def_start = i
                    break
            
            if plugin_def_start >= 0:
                while plugin_def_start > 0 and ("plugins" not in lines[plugin_def_start - 1].lower() or "{" not in lines[plugin_def_start - 1]):
                    plugin_def_start -= 1
                
                if plugin_def_start > 0 and "plugins" in lines[plugin_def_start]:
                    while plugin_def_start < len(lines) and "}" not in lines[plugin_def_start]:
                        plugin_def_start += 1
                    
                    lines = lines[:plugin_def_start + 1] + [""] + lines[plugin_def_start + 1:]
                    
                    insert_idx = 0
                    if lines[0].startswith("//"):
                        while insert_idx < len(lines) and lines[insert_idx].startswith("//"):
                            insert_idx += 1
                    
                    lines = lines[:insert_idx] + [pm] + [""] + lines[insert_idx:]
                
                with open(sf, "w") as f:
                    f.write("\n".join(lines))
                print(f"✓ Added pluginManagement block to settings.gradle")
            else:
                content = pm + "\n" + content
                with open(sf, "w") as f:
                    f.write(content)
                print(f"✓ Prepended pluginManagement block to settings.gradle")
        else:
            with open(sf) as f:
                sf_content = f.read()
            
            updated_sf = re.sub(
                r'id\(\s*"com\.android\.application"\s*\)\s*version\s*"[0-9][0-9]*\.[0-9]+"',
                f'id("com.android.application") version "{TARGET_AGP_VERSION}"',
                sf_content,
            )
            updated_sf = re.sub(
                r'id\(\s*"com\.android\.library"\s*\)\s*version\s*"[0-9][0-9]*\.[0-9]+"',
                f'id("com.android.library") version "{TARGET_AGP_VERSION}"',
                updated_sf,
            )
            
            if updated_sf != sf_content:
                with open(sf, "w") as f:
                    f.write(updated_sf)
                print(f"✓ Updated AGP version in existing pluginManagement block")
            else:
                print(f"⚠ Found pluginManagement but couldn't update version")
    else:
        print(f"Error: {sf} not found!")

print("\n--- Verifying changes ---")
for fp in all_gradle_files:
    if os.path.exists(fp):
        with open(fp) as f:
            for i, line in enumerate(f, 1):
                if "8.5.0" in line or "8.6.0" in line:
                    print(f"  Still found old version in {fp}:{i}: {line.strip()}")
                if TARGET_AGP_VERSION in line and any(keyword in line.lower() for keyword in ["gradle", "agp", "android.application", "android.library"]):
                    print(f"  ✓ New version confirmed in {fp}:{i}")

print("\n=== Fix script completed ===")