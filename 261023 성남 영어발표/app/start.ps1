param(
    [ValidateSet('presentation','speaker','script')][string]$View = 'presentation',
    [switch]$NoBrowser,
    [switch]$Restart,
    [switch]$AppWindow,
    [switch]$Quiet
)
$ErrorActionPreference = 'Stop'
$taskPrimary = 'C:\Users\sajw1\OneDrive\문서\ChatGPT\영어발표'
$taskRoot = if (Test-Path -LiteralPath (Join-Path $taskPrimary 'server.mjs')) { $taskPrimary } else { $PSScriptRoot }
# Keep the old 3232 browser storage while serving the same current source files.
& (Join-Path $taskRoot 'scripts\launch-presentation.ps1') -Root $taskRoot -Port 3232 -ConfigFile (Join-Path $PSScriptRoot '.env.local') -View $View -Restart:$Restart -NoBrowser:$NoBrowser -AppWindow:$AppWindow -Quiet:$Quiet
