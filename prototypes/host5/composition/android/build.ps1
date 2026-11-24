param([Parameter(Mandatory)][string]$PlatformJar,[Parameter(Mandatory)][string]$Aapt2,[Parameter(Mandatory)][string]$DexJar,[Parameter(Mandatory)][string]$ApksigJar,[Parameter(Mandatory)][string]$JdkBin,[Parameter(Mandatory)][string]$Page,[Parameter(Mandatory)][string]$Output,[switch]$FontPicker)
$ErrorActionPreference='Stop'
if(Test-Path -LiteralPath $Output){throw 'Output must be a new directory'}
New-Item -ItemType Directory -Path "$Output/classes" -Force | Out-Null
function Run($exe,[string[]]$args2){& $exe @args2; if($LASTEXITCODE -ne 0){throw "Tool failed: $exe"}}
$manifest="$PSScriptRoot/AndroidManifest.xml"
$sources=@("$PSScriptRoot/ProbeActivity.java")
if ($FontPicker) {
 $sources+="$PSScriptRoot/ProbeFontDocuments.java"
 $xml=[IO.File]::ReadAllText($manifest).Replace('</application>','<provider android:name=".ProbeFontDocuments" android:authorities="org.dolui.host5.neutralprobe.fonts" android:permission="android.permission.MANAGE_DOCUMENTS" android:exported="true" android:grantUriPermissions="true"><intent-filter><action android:name="android.content.action.DOCUMENTS_PROVIDER"/></intent-filter></provider></application>')
 $manifest="$Output/AndroidManifest.xml"
 [IO.File]::WriteAllText($manifest,$xml)
}
Run "$JdkBin/javac.exe" (@('--release','8','-classpath',$PlatformJar,'-d',"$Output/classes")+$sources)
$classes=@(Get-ChildItem "$Output/classes" -Recurse -Filter '*.class' | ForEach-Object FullName)
Run "$JdkBin/java.exe" (@('-cp',$DexJar,'com.android.tools.r8.D8','--min-api','28','--lib',$PlatformJar,'--output',$Output)+$classes)
Run $Aapt2 @('link','-o',"$Output/unsigned.apk",'-I',$PlatformJar,'--manifest',$manifest)
Run 'python' @('-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"a",zipfile.ZIP_DEFLATED); z.write(sys.argv[2],"classes.dex"); z.write(sys.argv[3],"assets/index.html"); z.close()',"$Output/unsigned.apk","$Output/classes.dex",$Page)
$env:SF_APK_KEY_PASS=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
try {
 Run "$JdkBin/keytool.exe" @('-genkeypair','-keystore',"$Output/key.p12",'-storetype','PKCS12','-storepass:env','SF_APK_KEY_PASS','-alias','sf-neutral','-keyalg','RSA','-keysize','2048','-validity','365','-dname','CN=Host5 Neutral Probe')
 Run "$JdkBin/java.exe" @('-cp',$ApksigJar,"$PSScriptRoot/SignTestApk.java","$Output/key.p12","$Output/unsigned.apk","$Output/probe.apk")
} finally {Remove-Item Env:SF_APK_KEY_PASS -ErrorAction SilentlyContinue}
Run $Aapt2 @('dump','permissions',"$Output/probe.apk")
Get-FileHash "$Output/probe.apk" -Algorithm SHA256
