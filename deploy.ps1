# SmartGarden 1-Click Automated Deployer for Windows
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = Get-Location }
$downloadsDir = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$logFile = [System.IO.Path]::Combine($projectDir, "deploy_log.txt")
$envFile = [System.IO.Path]::Combine($projectDir, ".env")

# Initialize Log
$startTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"====================================================" | Out-File -FilePath $logFile -Encoding utf8
"[LOG] SMARTGARDEN DEPLOYMENT STARTED AT: $startTime" | Out-File -FilePath $logFile -Append -Encoding utf8
"====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8

Write-Host "====================================================" -ForegroundColor Green
Write-Host "  🌱 SMARTGARDEN 1-CLICK AUTO UPDATE & DEPLOY" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Log file: deploy_log.txt" -ForegroundColor Yellow

# Default credentials from your configuration
$ftpHost = "smartgarden.gr"
$ftpUser = "smartgarden.gr_8p3lo1vph0t"
$ftpPass = "Uc0Lptjan_j47Eg~"
$remoteDir = "/httpdocs"

# Load values from .env if present
if (Test-Path $envFile) {
    Write-Host "[*] Loading settings from .env file..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            if ($key -eq "FTP_HOST" -and $val) { $ftpHost = $val }
            if ($key -eq "FTP_USER" -and $val) { $ftpUser = $val }
            if ($key -eq "FTP_PASSWORD" -and $val) { $ftpPass = $val }
            if ($key -eq "FTP_REMOTE_DIR" -and $val) { $remoteDir = $val }
        }
    }
}

# Step 1: Check for Latest ZIP in Downloads
Write-Host "`n[1/3] Checking for latest downloaded ZIP..." -ForegroundColor Cyan
try {
    $latestZip = Get-ChildItem -Path $downloadsDir -Filter "*.zip" -ErrorAction SilentlyContinue | 
                 Sort-Object LastWriteTime -Descending | 
                 Select-Object -First 1

    if ($latestZip) {
        $zipAge = (Get-Date) - $latestZip.LastWriteTime
        if ($zipAge.TotalHours -lt 24) {
            Write-Host "[*] Found ZIP: $($latestZip.FullName)" -ForegroundColor Green
            "[LOG] Extracting ZIP: $($latestZip.FullName)" | Out-File -FilePath $logFile -Append -Encoding utf8
            Expand-Archive -Path $latestZip.FullName -DestinationPath $projectDir -Force
            "[LOG] ZIP extracted successfully." | Out-File -FilePath $logFile -Append -Encoding utf8
        }
    }
} catch {
    "[LOG] Notice during ZIP extraction: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Step 2: Build with NPM
Write-Host "`n[2/3] Building application (npm run build)..." -ForegroundColor Cyan
Set-Location $projectDir

"[LOG] Running npm run build..." | Out-File -FilePath $logFile -Append -Encoding utf8
$buildOutput = cmd /c "npm run build 2>&1"
$buildOutput | Out-File -FilePath $logFile -Append -Encoding utf8

$distPath = [System.IO.Path]::Combine($projectDir, "dist")
if (-not (Test-Path $distPath)) {
    Write-Host "`n[!] ERROR: Build failed. dist directory was not created." -ForegroundColor Red
    "[LOG] ERROR: dist directory not found!" | Out-File -FilePath $logFile -Append -Encoding utf8
    notepad $logFile
    exit 1
}

Write-Host "[*] Build succeeded! dist folder ready." -ForegroundColor Green
"[LOG] Build succeeded." | Out-File -FilePath $logFile -Append -Encoding utf8

# Step 3: FTP Upload
Write-Host "`n[3/3] Connecting to FTP and uploading to smartgarden.gr..." -ForegroundColor Cyan

# Test connection with fallbacks
$candidateHosts = @($ftpHost, "ftp.smartgarden.gr", "admin.mynewserver.com")
$workingHost = $ftpHost
$workingPassive = $true
$connected = $false

foreach ($h in $candidateHosts) {
    foreach ($p in @($true, $false)) {
        try {
            $t = [System.Net.FtpWebRequest]::Create("ftp://$h$remoteDir/")
            $t.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $t.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
            $t.UsePassive = $p
            $t.Timeout = 5000
            $t.ReadWriteTimeout = 5000
            $t.KeepAlive = $false
            $r = $t.GetResponse()
            $r.Close()
            $workingHost = $h
            $workingPassive = $p
            $connected = $true
            Write-Host "[+] Connection verified on $workingHost (Passive=$workingPassive)" -ForegroundColor Green
            break
        } catch {
            # retry candidate
        }
    }
    if ($connected) { break }
}

$files = Get-ChildItem -Path $distPath -Recurse -File
$totalFiles = $files.Count
$idx = 0
$uploadSuccessCount = 0

foreach ($file in $files) {
    $idx++
    $relative = $file.FullName.Substring($distPath.Length).Replace('\', '/')
    $remoteUri = "ftp://$workingHost$remoteDir$relative"
    $remoteFileDir = [System.IO.Path]::GetDirectoryName($remoteUri).Replace('\', '/')

    Write-Host "[$idx/$totalFiles] Uploading: $relative ($($file.Length) bytes)" -ForegroundColor White

    # Ensure remote sub-directory exists
    try {
        $dirReq = [System.Net.FtpWebRequest]::Create($remoteFileDir)
        $dirReq.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $dirReq.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $dirReq.UsePassive = $workingPassive
        $dirReq.KeepAlive = $false
        $null = $dirReq.GetResponse()
    } catch {}

    $fileUploaded = $false
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $wc.UploadFile($remoteUri, $file.FullName)
        $wc.Dispose()
        $fileUploaded = $true
    } catch {
        try {
            $req = [System.Net.FtpWebRequest]::Create($remoteUri)
            $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UsePassive = $workingPassive
            $req.UseBinary = $true
            $req.KeepAlive = $false
            
            $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $req.ContentLength = $fileBytes.Length
            $stream = $req.GetRequestStream()
            $stream.Write($fileBytes, 0, $fileBytes.Length)
            $stream.Close()
            $req.GetResponse().Close()
            $fileUploaded = $true
        } catch {
            Write-Host "  [!] Error: $_" -ForegroundColor Red
            "[LOG] Error uploading $relative : $_" | Out-File -FilePath $logFile -Append -Encoding utf8
        }
    }

    if ($fileUploaded) {
        $uploadSuccessCount++
        "[LOG] OK: $relative" | Out-File -FilePath $logFile -Append -Encoding utf8
    }
}

$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"`n====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[LOG] UPLOAD SUMMARY: $uploadSuccessCount / $totalFiles files uploaded at $endTime" | Out-File -FilePath $logFile -Append -Encoding utf8
"====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8

if ($uploadSuccessCount -eq $totalFiles) {
    Write-Host "`n====================================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS! ALL $totalFiles FILES UPLOADED TO SMARTGARDEN.GR!" -ForegroundColor Green
    Write-Host "  🌐 Refresh your browser at: https://smartgarden.gr" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Green
} else {
    Write-Host "`n[!] Uploaded $uploadSuccessCount of $totalFiles files. Check deploy_log.txt." -ForegroundColor Yellow
}
# SmartGarden 1-Click Automated Deployer for Windows
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = Get-Location }
$downloadsDir = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$logFile = [System.IO.Path]::Combine($projectDir, "deploy_log.txt")
$envFile = [System.IO.Path]::Combine($projectDir, ".env")

# Initialize Log
$startTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"====================================================" | Out-File -FilePath $logFile -Encoding utf8
"[LOG] SMARTGARDEN DEPLOYMENT STARTED AT: $startTime" | Out-File -FilePath $logFile -Append -Encoding utf8
"====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8

Write-Host "====================================================" -ForegroundColor Green
Write-Host "  🌱 SMARTGARDEN 1-CLICK AUTO UPDATE & DEPLOY" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Log file: deploy_log.txt" -ForegroundColor Yellow

# Default credentials from your configuration
$ftpHost = "smartgarden.gr"
$ftpUser = "smartgarden.gr_8p3lo1vph0t"
$ftpPass = "Uc0Lptjan_j47Eg~"
$remoteDir = "/httpdocs"

# Load values from .env if present
if (Test-Path $envFile) {
    Write-Host "[*] Loading settings from .env file..." -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            if ($key -eq "FTP_HOST" -and $val) { $ftpHost = $val }
            if ($key -eq "FTP_USER" -and $val) { $ftpUser = $val }
            if ($key -eq "FTP_PASSWORD" -and $val) { $ftpPass = $val }
            if ($key -eq "FTP_REMOTE_DIR" -and $val) { $remoteDir = $val }
        }
    }
}

# Step 1: Check for Latest ZIP in Downloads
Write-Host "`n[1/3] Checking for latest downloaded ZIP..." -ForegroundColor Cyan
try {
    $latestZip = Get-ChildItem -Path $downloadsDir -Filter "*.zip" -ErrorAction SilentlyContinue | 
                 Sort-Object LastWriteTime -Descending | 
                 Select-Object -First 1

    if ($latestZip) {
        $zipAge = (Get-Date) - $latestZip.LastWriteTime
        if ($zipAge.TotalHours -lt 24) {
            Write-Host "[*] Found ZIP: $($latestZip.FullName)" -ForegroundColor Green
            "[LOG] Extracting ZIP: $($latestZip.FullName)" | Out-File -FilePath $logFile -Append -Encoding utf8
            Expand-Archive -Path $latestZip.FullName -DestinationPath $projectDir -Force
            "[LOG] ZIP extracted successfully." | Out-File -FilePath $logFile -Append -Encoding utf8
        }
    }
} catch {
    "[LOG] Notice during ZIP extraction: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Step 2: Build with NPM
Write-Host "`n[2/3] Building application (npm run build)..." -ForegroundColor Cyan
Set-Location $projectDir

"[LOG] Running npm run build..." | Out-File -FilePath $logFile -Append -Encoding utf8
$buildOutput = cmd /c "npm run build 2>&1"
$buildOutput | Out-File -FilePath $logFile -Append -Encoding utf8

$distPath = [System.IO.Path]::Combine($projectDir, "dist")
if (-not (Test-Path $distPath)) {
    Write-Host "`n[!] ERROR: Build failed. dist directory was not created." -ForegroundColor Red
    "[LOG] ERROR: dist directory not found!" | Out-File -FilePath $logFile -Append -Encoding utf8
    notepad $logFile
    exit 1
}

Write-Host "[*] Build succeeded! dist folder ready." -ForegroundColor Green
"[LOG] Build succeeded." | Out-File -FilePath $logFile -Append -Encoding utf8

# Step 3: FTP Upload
Write-Host "`n[3/3] Connecting to FTP and uploading to smartgarden.gr..." -ForegroundColor Cyan

# Test connection with fallbacks
$candidateHosts = @($ftpHost, "ftp.smartgarden.gr", "admin.mynewserver.com")
$workingHost = $ftpHost
$workingPassive = $true
$connected = $false

foreach ($h in $candidateHosts) {
    foreach ($p in @($true, $false)) {
        try {
            $t = [System.Net.FtpWebRequest]::Create("ftp://$h$remoteDir/")
            $t.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $t.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
            $t.UsePassive = $p
            $t.Timeout = 5000
            $t.ReadWriteTimeout = 5000
            $t.KeepAlive = $false
            $r = $t.GetResponse()
            $r.Close()
            $workingHost = $h
            $workingPassive = $p
            $connected = $true
            Write-Host "[+] Connection verified on $workingHost (Passive=$workingPassive)" -ForegroundColor Green
            break
        } catch {
            # retry candidate
        }
    }
    if ($connected) { break }
}

$files = Get-ChildItem -Path $distPath -Recurse -File
$totalFiles = $files.Count
$idx = 0
$uploadSuccessCount = 0

foreach ($file in $files) {
    $idx++
    $relative = $file.FullName.Substring($distPath.Length).Replace('\', '/')
    $remoteUri = "ftp://$workingHost$remoteDir$relative"
    $remoteFileDir = [System.IO.Path]::GetDirectoryName($remoteUri).Replace('\', '/')

    Write-Host "[$idx/$totalFiles] Uploading: $relative ($($file.Length) bytes)" -ForegroundColor White

    # Ensure remote sub-directory exists
    try {
        $dirReq = [System.Net.FtpWebRequest]::Create($remoteFileDir)
        $dirReq.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $dirReq.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $dirReq.UsePassive = $workingPassive
        $dirReq.KeepAlive = $false
        $null = $dirReq.GetResponse()
    } catch {}

    $fileUploaded = $false
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $wc.UploadFile($remoteUri, $file.FullName)
        $wc.Dispose()
        $fileUploaded = $true
    } catch {
        try {
            $req = [System.Net.FtpWebRequest]::Create($remoteUri)
            $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UsePassive = $workingPassive
            $req.UseBinary = $true
            $req.KeepAlive = $false
            
            $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $req.ContentLength = $fileBytes.Length
            $stream = $req.GetRequestStream()
            $stream.Write($fileBytes, 0, $fileBytes.Length)
            $stream.Close()
            $req.GetResponse().Close()
            $fileUploaded = $true
        } catch {
            Write-Host "  [!] Error: $_" -ForegroundColor Red
            "[LOG] Error uploading $relative : $_" | Out-File -FilePath $logFile -Append -Encoding utf8
        }
    }

    if ($fileUploaded) {
        $uploadSuccessCount++
        "[LOG] OK: $relative" | Out-File -FilePath $logFile -Append -Encoding utf8
    }
}
# ========================================================
# [4/4] Αυτόματη εκτέλεση Cron & Άμεση Ενημέρωση του Site
# ========================================================
Write-Host "`n[*] Triggering Auto-Publisher on smartgarden.gr..." -ForegroundColor Cyan

try {
    # Καλεί το cron-publish.php αυτόματα (χωρίς να χρειάζεται Odin)
    $response = Invoke-RestMethod -Uri "https://smartgarden.gr/cron-publish.php" -Method Get -Headers @{ "Cache-Control"="no-cache" }
    Write-Host "[+] Published Article: $($response.article.title)" -ForegroundColor Green
    Write-Host "[+] Status: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "[-] Note: Cron trigger failed or timed out: $_" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! SITE & ARTICLES FULLY UPDATED!" -ForegroundColor Green
Write-Host "  Live Preview: https://smartgarden.gr" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Green
$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"`n====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[LOG] UPLOAD SUMMARY: $uploadSuccessCount / $totalFiles files uploaded at $endTime" | Out-File -FilePath $logFile -Append -Encoding utf8
"====================================================" | Out-File -FilePath $logFile -Append -Encoding utf8

if ($uploadSuccessCount -eq $totalFiles) {
    Write-Host "`n====================================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS! ALL $totalFiles FILES UPLOADED TO SMARTGARDEN.GR!" -ForegroundColor Green
    Write-Host "  🌐 Refresh your browser at: https://smartgarden.gr" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Green
} else {
    Write-Host "`n[!] Uploaded $uploadSuccessCount of $totalFiles files. Check deploy_log.txt." -ForegroundColor Yellow
}
