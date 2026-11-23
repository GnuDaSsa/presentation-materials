param(
    [Parameter(Mandatory=$true)][string]$Root,
    [ValidateRange(1024,65535)][int]$Port = 3230,
    [ValidateSet('presentation','speaker','script')][string]$View = 'presentation',
    [string]$FallbackEnvFile = '',
    [string]$ConfigFile = '',
    [switch]$Restart,
    [switch]$NoBrowser,
    [switch]$AppWindow,
    [switch]$Quiet
)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path -LiteralPath $Root).Path
$taskUrl = "http://127.0.0.1:$Port"
$taskServer = Join-Path $taskRoot 'server.mjs'
$taskLogs = Join-Path $taskRoot 'logs'
$taskLock = $null
$taskLocked = $false

function Test-PresentationHealth {
    try {
        $taskHealth = Invoke-RestMethod -Uri ($taskUrl + '/api/health') -TimeoutSec 2
        return $taskHealth.app -eq 'workshop-live-captions'
    } catch { return $false }
}

try {
    New-Item -ItemType Directory -Force -Path $taskLogs | Out-Null
    # Serialize rapid double-clicks and the Windows sign-in launch.
    $taskLock = [Threading.Mutex]::new($false, "Local\SeongnamPresentation-$Port")
    try { $taskLocked = $taskLock.WaitOne(45000) }
    catch [Threading.AbandonedMutexException] { $taskLocked = $true }
    if (-not $taskLocked) { throw 'Another presentation launch is taking too long. Please try again.' }

    # Upgrade the local companion on the next app launch, only when no presentation is active.
    if (-not $Restart -and -not $NoBrowser -and (Test-PresentationHealth)) {
        try {
            $taskHealth = Invoke-RestMethod -Uri ($taskUrl + '/api/health') -TimeoutSec 2
            if (-not $taskHealth.ipadStreaming -or -not $taskHealth.ipadControl -or -not $taskHealth.videoStreaming) {
                $taskLinks = Invoke-RestMethod -Uri ($taskUrl + '/api/ipad-link') -TimeoutSec 2
                $taskLink = @($taskLinks.urls)[0]
                if ($taskLink) {
                    $taskUri = [UriBuilder]::new($taskLink)
                    $taskUri.Host = '127.0.0.1'
                    $taskUri.Path = '/state'
                    $taskState = Invoke-RestMethod -Uri $taskUri.Uri.AbsoluteUri -TimeoutSec 2
                    $taskAge = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() - [long]$taskState.updatedAt
                    if (-not $taskState.running -or $taskAge -gt 20000) { $Restart = $true }
                }
            }
        } catch { # Uncertain state: leave the currently running presentation alone.
        }
    }

    if ($Restart) {
        $taskListeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($taskOwner in @($taskListeners.OwningProcess | Select-Object -Unique)) {
            if (-not $taskOwner) { continue }
            $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$taskOwner"
            if ($taskProcess.Name -ne 'node.exe' -or -not $taskProcess.CommandLine -or -not $taskProcess.CommandLine.Contains($taskServer)) {
                throw "Port $Port belongs to another process. It was not stopped."
            }
            Stop-Process -Id $taskOwner -ErrorAction Stop
            Wait-Process -Id $taskOwner -Timeout 5 -ErrorAction SilentlyContinue
        }
    }

    $taskRunning = Test-PresentationHealth
    if (-not $taskRunning) {
        $taskOccupied = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($taskOccupied) { throw "Port $Port is already in use by another application. It was not stopped." }
        $taskNode = Join-Path $taskRoot '.runtime\node.exe'
        if (-not (Test-Path -LiteralPath $taskNode)) { $taskNode = (Get-Command node -ErrorAction Stop).Source }
        if ([int]((& $taskNode --version).TrimStart('v').Split('.')[0]) -lt 22) { throw 'Node.js 22 or newer is required.' }
        $taskPreviousPort = $env:PORT
        $taskPreviousEnv = $env:CAPTION_ENV_FILE
        try {
            $env:PORT = [string]$Port
            $taskOwnEnv = Join-Path $taskRoot '.env.local'
            if ($ConfigFile -and (Test-Path -LiteralPath $ConfigFile)) { $env:CAPTION_ENV_FILE = $ConfigFile }
            elseif (Test-Path -LiteralPath $taskOwnEnv) { $env:CAPTION_ENV_FILE = $taskOwnEnv }
            elseif ($FallbackEnvFile -and (Test-Path -LiteralPath $FallbackEnvFile)) { $env:CAPTION_ENV_FILE = $FallbackEnvFile }
            $taskChild = Start-Process -FilePath $taskNode -ArgumentList ('"' + $taskServer + '"') -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskLogs 'server.log') -RedirectStandardError (Join-Path $taskLogs 'server-error.log') -PassThru
        } finally {
            $env:PORT = $taskPreviousPort
            $env:CAPTION_ENV_FILE = $taskPreviousEnv
        }
        for ($taskRetry = 0; $taskRetry -lt 60; $taskRetry++) {
            if (Test-PresentationHealth) { $taskRunning = $true; break }
            $taskChild.Refresh()
            if ($taskChild.HasExited) { break }
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $taskRunning) { throw 'Could not start the presentation. See logs/server-error.log.' }
} catch {
    $taskError = $_.Exception.Message
    try { Add-Content -LiteralPath (Join-Path $taskLogs 'launcher-error.log') -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $taskError) -Encoding UTF8 } catch {}
    if (-not $Quiet) {
        Add-Type -AssemblyName System.Windows.Forms
        [Windows.Forms.MessageBox]::Show($taskError, 'Seongnam Presentation', 'OK', 'Error') | Out-Null
    }
    throw
} finally {
    if ($taskLocked) { $taskLock.ReleaseMutex() }
    if ($taskLock) { $taskLock.Dispose() }
}

$taskPage = if ($View -eq 'speaker') { '/speaker.html' } elseif ($View -eq 'script') { '/script-studio.html' } else { '/?lang=en' }
if (-not $NoBrowser) {
    $taskBrowser = $null
    if ($AppWindow) {
        $taskCandidates = @(
            (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
            (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
            (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
        )
        $taskBrowser = $taskCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    }
    if ($taskBrowser) { Start-Process -FilePath $taskBrowser -ArgumentList ('--app="' + $taskUrl + $taskPage + '"'), '--start-maximized' }
    else { Start-Process ($taskUrl + $taskPage) }
}
Write-Output ($taskUrl + $taskPage)
