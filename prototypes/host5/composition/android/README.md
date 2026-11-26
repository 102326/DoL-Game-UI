# Host5 neutral Android shell

This temporary test shell embeds one supplied, self-contained HTML page as `assets/index.html`. It has no network permission, blocks network loads, disables file/content access and backup, and emits only page console messages prefixed `SW41 ` under logcat tag `Host5Probe`. It uses the system WebView and does not change the WebView provider. Its package is `org.dolui.host5.neutralprobe`; check that the package is absent before installing and never replace another installation.

Build on Windows with Java 21, Python 3, an Android platform `android.jar`, `aapt2`, R8/D8 jar and Android `apksig` jar. Supply their paths and a **new** ignored output directory:

```powershell
./prototypes/host5/composition/android/build.ps1 -PlatformJar <android.jar> -Aapt2 <aapt2.exe> -DexJar <r8.jar> -ApksigJar <apksig.jar> -JdkBin <jdk-bin> -Page <self-contained-index.html> -Output <new-ignored-directory>
```

The script produces and verifies a locally signed `probe.apk`; the private key is temporary and stays in that output directory. Inspect package and permissions before installation. The page is the only bundled asset; JavaScript and native lifecycle behavior remain those of the provided page and system WebView. Remove only this test package and its own temporary build files after the session, retaining the directed evidence required by the task.

### Local TTF picker

Generate the offline settings page with `node prototypes/host5/theme/build-ttf-tablet-page.mts <Host.zip> <UI.zip> <new-output.html>`. Pass this page to the same build command with `-FontPicker`. Start the activity with `--ez ttfPicker true` to enable DOM storage and single-file selection. For glyph inspection only, add `--ez inspectProbe true` and bind the inspecting client to this app's WebView PID.

The system document picker exposes a read-only **SoftWet TTF QA** location when the device supplies `/system/fonts/DroidSansMono.ttf`. The activity accepts only that provider's test document URI, requests no storage permission and retains no URI grant. On the tested Xiaomi tablet the route was **更多 → 查看更多文件 → SoftWet TTF QA → DroidSansMono.ttf**. First cancel once and check that settings stays open with no pending font. Then select the file, preview, save and cold-start the app with the same extras. Restore defaults, cold-start again, and check the font record is gone.
