# Native tools write notes to stderr; failures are caught via $LASTEXITCODE after each step.
$ErrorActionPreference = "Continue"

$AndroidSdk = "C:\Users\DELL\AppData\Local\Android\Sdk"
$BuildTools = "$AndroidSdk\build-tools\35.0.0"
$AndroidJar = "$AndroidSdk\platforms\android-35\android.jar"
$JdkBin = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin"

$aapt2 = "$BuildTools\aapt2.exe"
$d8 = "$BuildTools\d8.bat"
$zipalign = "$BuildTools\zipalign.exe"
$apksigner = "$BuildTools\apksigner.bat"
$javac = "$JdkBin\javac.exe"
$jar = "$JdkBin\jar.exe"
$keytool = "$JdkBin\keytool.exe"

$appDir = $PSScriptRoot
if (-not $appDir) { $appDir = (Resolve-Path ".").Path }
$androidDir = Join-Path $appDir "android"

$buildDir = Join-Path $androidDir "build"
$distDir = Join-Path $appDir "dist"
$rootDir = (Resolve-Path "$appDir\..\..").Path

if (Test-Path $buildDir) { Remove-Item -Path $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path "$buildDir\gen", "$buildDir\obj", "$buildDir\dex", $distDir -Force | Out-Null

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Building DawaDash Customer Android APK   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Compile resources with aapt2
Write-Host "[1/7] Compiling Android resources..." -ForegroundColor Yellow
$compiledResZip = "$buildDir\compiled_res.zip"
& $aapt2 compile --dir "$androidDir\res" -o $compiledResZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed with code $LASTEXITCODE" }

# 2. Link resources and generate R.java
Write-Host "[2/7] Linking resources and generating R.java..." -ForegroundColor Yellow
$baseApk = "$buildDir\base.apk"
$manifest = "$androidDir\AndroidManifest.xml"
$assets = "$androidDir\assets"

$linkArgs = @('link', '-o', $baseApk, '-I', $AndroidJar, '--manifest', $manifest, $compiledResZip, '--java', "$buildDir\gen", '--auto-add-overlay')
if ((Test-Path $assets) -and (Get-ChildItem $assets -Recurse -File)) { $linkArgs += @('-A', $assets) }
& $aapt2 @linkArgs
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed with code $LASTEXITCODE" }

# 3. Compile Java sources
Write-Host "[3/7] Compiling Java source files..." -ForegroundColor Yellow
$javaFiles = @()
$javaFiles += (Get-ChildItem -Path "$buildDir\gen" -Filter *.java -Recurse | ForEach-Object { $_.FullName })
$javaFiles += (Get-ChildItem -Path "$androidDir\src" -Filter *.java -Recurse | ForEach-Object { $_.FullName })

$javaFilesListFile = "$buildDir\sources.txt"
[System.IO.File]::WriteAllLines($javaFilesListFile, $javaFiles, [System.Text.Encoding]::ASCII)

& $javac -encoding UTF-8 -d "$buildDir\obj" -cp $AndroidJar "@$javaFilesListFile"
if ($LASTEXITCODE -ne 0) { throw "javac failed with code $LASTEXITCODE" }

# 4. Convert classes to DEX bytecode with D8
Write-Host "[4/7] Converting bytecode to classes.dex with D8..." -ForegroundColor Yellow
$classFiles = (Get-ChildItem -Path "$buildDir\obj" -Filter *.class -Recurse | ForEach-Object { $_.FullName })

& $d8 --output "$buildDir\dex" --lib $AndroidJar --min-api 26 $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed with code $LASTEXITCODE" }

# 5. Add classes.dex into base.apk
Write-Host "[5/7] Packaging classes.dex into APK..." -ForegroundColor Yellow
Push-Location "$buildDir\dex"
try {
    & $jar uf $baseApk classes.dex
    if ($LASTEXITCODE -ne 0) { throw "jar uf failed with code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# 6. Align APK with zipalign
Write-Host "[6/7] 4-byte zip alignment..." -ForegroundColor Yellow
$alignedApk = "$buildDir\aligned.apk"
& $zipalign -f -p 4 $baseApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed with code $LASTEXITCODE" }

# 7. Sign APK with apksigner
Write-Host "[7/7] Signing APK with release keystore..." -ForegroundColor Yellow
$keystore = "$androidDir\dawadash-release.keystore"
if (-not (Test-Path $keystore)) {
    Write-Host "Generating release keystore..." -ForegroundColor Cyan
    & $keytool -genkeypair -v -keystore $keystore -alias dawadash -keyalg RSA -keysize 2048 -validity 10000 -storepass dawadash123 -keypass dawadash123 -dname "CN=DawaDash Customer, OU=Mobile, O=DawaDash, L=Lucknow, ST=Uttar Pradesh, C=IN"
    if ($LASTEXITCODE -ne 0) { throw "keytool failed with code $LASTEXITCODE" }
}

$outputApk = "$distDir\DawaDash-Customer.apk"
& $apksigner sign --ks $keystore --ks-pass pass:dawadash123 --ks-key-alias dawadash --key-pass pass:dawadash123 --out $outputApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed with code $LASTEXITCODE" }

# Verify APK signature
Write-Host "Verifying APK signature..." -ForegroundColor Cyan
& $apksigner verify --verbose $outputApk
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed with code $LASTEXITCODE" }

# Copy to root directory for convenient download
$rootApk = Join-Path $rootDir "DawaDash-Customer.apk"
Copy-Item -Path $outputApk -Destination $rootApk -Force

# Publish via the website: public/ is copied into the web build, served at /DawaDash-Customer.apk (page: /download).
# Commit and push public/DawaDash-Customer.apk to release it. Update version/size in public/download.html.
$publicApk = Join-Path $appDir "public\DawaDash-Customer.apk"
Copy-Item -Path $outputApk -Destination $publicApk -Force

$apkSize = (Get-Item $outputApk).Length
$apkSizeMB = [math]::Round($apkSize / 1MB, 2)

Write-Host "==========================================" -ForegroundColor Green
Write-Host " BUILD SUCCESSFUL!                        " -ForegroundColor Green
Write-Host " Output APK: $outputApk ($apkSizeMB MB)   " -ForegroundColor Green
Write-Host " Root APK:   $rootApk                     " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
