import re
import os

print("=== Starting Android build fix script ===")

app_build = "mobile/android/app/build.gradle"

if os.path.exists(app_build):
    with open(app_build, "r") as f:
        c = f.read()
    lines = [l for l in c.split("\n") if not (l.strip().startswith("hermesEnabled") and "=" in l)]
    with open(app_build, "w") as f:
        f.write("\n".join(lines))
    print("Fix1: Removed hermesEnabled from wrong location")
else:
    print(f"Warning: {app_build} not found")

files_to_check = ["mobile/android/settings.gradle", "mobile/android/build.gradle"]

for root, dirs, files in os.walk("mobile/android"):
    for f in files:
        if f.endswith(".toml"):
            files_to_check.append(os.path.join(root, f))

agp_upgraded = False

for fp in files_to_check:
    if not os.path.exists(fp):
        continue
    with open(fp) as f:
        content = f.read()
    orig = content
    
    content = re.sub(
        r"com\.android\.tools\.build:gradle:[0-9][0-9]*\.[0-9]+[\.0-9]*",
        "com.android.tools.build:gradle:8.7.0",
        content,
    )
    
    content = re.sub(
        r'id\("com\.android\.application"\)\s+version\s+"[0-9][0-9]*\.[0-9]+"',
        'id("com.android.application") version "8.7.0"',
        content,
    )
    
    content = re.sub(
        r"(agp|androidGradlePlugin)\s*=\s*\"[0-9][0-9]*\.[0-9]+\"",
        r'\1 = "8.7.0"',
        content,
    )
    
    if content != orig:
        with open(fp, "w") as f:
            f.write(content)
        print(f"AGP upgraded: {fp}")
        agp_upgraded = True

if not agp_upgraded:
    sf = "mobile/android/settings.gradle"
    if os.path.exists(sf):
        with open(sf) as f:
            content = f.read()
        if "pluginManagement" not in content:
            pm = """pluginManagement {
  plugins {
    id("com.android.application") version "8.7.0" apply false
    id("com.android.library") version "8.7.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
  }
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}
"""
            content = pm + "\n" + content
            with open(sf, "w") as f:
                f.write(content)
            print("Added pluginManagement block to settings.gradle")
    else:
        print(f"Warning: {sf} not found")

print("=== Fix script completed ===")