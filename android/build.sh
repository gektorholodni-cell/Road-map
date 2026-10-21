#!/usr/bin/env bash
# Собирает APK без Android Studio и Gradle.
# Нужны: Node.js, JDK, aapt2, dalvik-exchange (dx), zipalign, apksigner и android.jar (API 23+).
# В Ubuntu/Debian: apt install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=${KEYSTORE:-$PWD/release.keystore}
KEY_PASS=${KEY_PASS:-islands-roadmap}
DX=${DX:-dalvik-exchange}
OUT=build

rm -rf "$OUT"
mkdir -p "$OUT/assets/www" "$OUT/classes" "$OUT/gen"

# 1. Веб-приложение.
(cd .. && npm run build)
cp -r ../dist/. "$OUT/assets/www/"

# 2. Ресурсы и манифест.
aapt2 compile --dir res -o "$OUT/res.zip"
aapt2 link -o "$OUT/unsigned.apk" -I "$ANDROID_JAR" --manifest AndroidManifest.xml \
  -A "$OUT/assets" --java "$OUT/gen" "$OUT/res.zip"

# 3. Код.
javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -nowarn -d "$OUT/classes" \
  $(find src "$OUT/gen" -name '*.java')
"$DX" --dex --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && zip -q unsigned.apk classes.dex)

# 4. Выравнивание и подпись. Ключ создаётся один раз; для обновления поверх старой версии нужен тот же ключ.
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KEY_PASS" -keypass "$KEY_PASS" -alias roadmap \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Islands Roadmap"
fi
zipalign -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KEY_PASS" --out "$OUT/islands-roadmap.apk" "$OUT/aligned.apk"
apksigner verify "$OUT/islands-roadmap.apk"
echo "Готово: android/$OUT/islands-roadmap.apk"
