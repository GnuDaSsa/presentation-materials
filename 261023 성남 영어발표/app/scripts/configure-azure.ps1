$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Write-Host 'Azure Speech 설정: 기존 OpenAI 키는 유지됩니다.'
Write-Host 'Speech 리소스 > Keys and Endpoint에서 Key 1과 Location/Region을 확인하세요.'
$taskRegion = (Read-Host '지역 코드 (예: koreacentral)').Trim().ToLowerInvariant()
if ($taskRegion -notmatch '^[a-z][a-z0-9]{1,35}$') { throw '지역 코드를 다시 확인해 주세요. 예: koreacentral' }
$taskSecureKey = Read-Host 'Azure Speech Key 1 (입력 내용은 화면에 표시되지 않습니다)' -AsSecureString
$taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecureKey)
try { $taskKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer) }
if ($taskKey -notmatch '^[A-Za-z0-9_-]{20,200}$') { throw '키 형식이 올바르지 않습니다. Speech 리소스의 키를 복사해 주세요.' }
try {
  $taskToken = Invoke-RestMethod -Method Post -Uri "https://$taskRegion.api.cognitive.microsoft.com/sts/v1.0/issueToken" -Headers @{ 'Ocp-Apim-Subscription-Key' = $taskKey } -ContentType 'application/x-www-form-urlencoded' -Body '' -TimeoutSec 15
  if (-not $taskToken) { throw 'empty_token' }
} catch {
  $taskKey = $null
  throw 'Azure 인증에 실패했습니다. 키와 지역이 같은 Speech 리소스의 값인지, 인터넷이 연결돼 있는지 확인해 주세요. 설정은 변경하지 않았습니다.'
}
$taskToken = $null
$taskEnvPath = Join-Path $taskRoot '.env.local'
$taskExisting = if (Test-Path -LiteralPath $taskEnvPath) { [IO.File]::ReadAllText($taskEnvPath) } else { '' }
$taskLines = @($taskExisting -split '\r?\n' | Where-Object { $_ -notmatch '^\s*(?:export\s+)?(?:AZURE_SPEECH_KEY|AZURE_SPEECH_REGION|CAPTION_PROVIDER)\s*=' })
$taskNewEnv = ($taskLines -join "`n").TrimEnd() + "`nAZURE_SPEECH_KEY=$taskKey`nAZURE_SPEECH_REGION=$taskRegion`nCAPTION_PROVIDER=azure`n"
[IO.File]::WriteAllText($taskEnvPath, $taskNewEnv, [Text.UTF8Encoding]::new($false))
$taskKey = $null; $taskNewEnv = $null; $taskExisting = $null; $taskSecureKey.Dispose()
Write-Host 'Azure 인증 및 저장 완료. 발표 서버를 재시작합니다.'
try { & (Join-Path $taskRoot 'start.ps1') -Restart }
catch { Write-Host '키는 저장됐습니다. 현재 발표 서버를 닫고 발표시작.cmd를 다시 실행해 주세요.'; exit 1 }
Write-Host '화면을 새로고침한 뒤 설정에서 Azure Speech를 선택하고 영어로 말해 보세요.'
