#!/usr/bin/env bash
# Headless Android emulator smoke test for the chemie-lernen app.
#
# Environment: Virtuozzo container WITHOUT /dev/kvm (host device filter blocks
# KVM even for privileged docker) → emulator runs in pure software (TCG) mode:
#   - Boot takes ~8 min (ATD image) / ~19 min (google_apis image)
#   - system_server may restart once under TCG; ATD image is the stable choice
#   - Use `adb install` via push + `pm install` (streamed install breaks the
#     binder pipe under slow TCG); fresh install fixes stale resolver state
#
# Usage:  android/smoke-test-emulator.sh [avd-name]
# Requires: ANDROID_HOME/ANDROID_SDK_ROOT=/opt/android-sdk, SDK has
#   emulator + system-images;android-30;aosp_atd;x86_64 + avd created.

set -u
SDK=${ANDROID_HOME:-/opt/android-sdk}
AVD=${1:-cit}
EMU="$SDK/emulator/emulator"
ADB="$SDK/platform-tools/adb"
APK="${APK:-android/app/build/outputs/apk/debug/app-debug.apk}"
LOG=/tmp/emulator-smoke.log

echo "==> Booting headless emulator (TCG, no KVM available) — expect ~8-20 min"
nohup "$EMU" -avd "$AVD" -no-window -no-accel -gpu swiftshader_indirect \
  -no-snapshot -no-audio -no-boot-anim -memory 2048 -cores 4 -no-metrics \
  -wipe-data > "$LOG" 2>&1 &
EMU_PID=$!
echo "    emulator pid $EMU_PID (log: $LOG)"

# Wait for boot (ATD ~8 min, google_apis ~20 min under TCG)
SECONDS=0
until [ "$("$ADB" -e shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 60
  echo "    ... booting (${SECONDS}s)"
done
echo "==> Booted after ${SECONDS}s"

echo "==> Installing $APK"
"$ADB" -e push "$APK" /data/local/tmp/app.apk >/dev/null
"$ADB" -e shell pm uninstall de.chemielernen.app >/dev/null 2>&1
"$ADB" -e shell pm install -g /data/local/tmp/app.apk | tail -1
"$ADB" -e shell cmd package resolve-activity --brief de.chemielernen.app

echo "==> Launching"
"$ADB" -e shell am start -n de.chemielernen.app/.MainActivity | tail -1
sleep 60
"$ADB" -e shell pidof de.chemielernen.app
"$ADB" -e shell uiautomator dump /data/local/tmp/ui.xml >/dev/null 2>&1
"$ADB" -e shell cat /data/local/tmp/ui.xml | grep -oE 'text="[^"]+"' | grep -v 'text=""' | head -8

echo "==> Crash check (empty = clean)"
"$ADB" -e logcat -d -b crash -t 10 2>/dev/null | grep -i chemielernen | tail -3

echo "==> Done. Stop with: adb -e emu kill"
