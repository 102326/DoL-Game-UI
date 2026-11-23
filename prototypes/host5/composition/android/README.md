# Host5 neutral Android shell

This temporary test shell embeds one supplied, self-contained HTML page as `assets/index.html`. It has no network permission, blocks network loads, disables file/content access and backup, and emits only page console messages prefixed `SW41 ` under logcat tag `Host5Probe`. It uses the system WebView and does not change the WebView provider. Its package is `org.dolui.host5.neutralprobe`; check that the package is absent before installing and never replace another installation.

Build on Windows with Java 21, Python 3, an Android platform `android.jar`, `aapt2`, R8/D8 jar and Android `apksig` jar. Supply their paths and a **new** ignored output directory:

```powershell
./prototypes/host5/composition/android/build.ps1 -PlatformJar <android.jar> -Aapt2 <aapt2.exe> -DexJar <r8.jar> -ApksigJar <apksig.jar> -JdkBin <jdk-bin> -Page <self-contained-index.html> -Output <new-ignored-directory>
```

The script produces and verifies a locally signed `probe.apk`; the private key is temporary and stays in that output directory. Inspect package and permissions before installation. The page is the only bundled asset; JavaScript and native lifecycle behavior remain those of the provided page and system WebView. Remove only this test package and its own temporary build files after the session, retaining the directed evidence required by the task.
