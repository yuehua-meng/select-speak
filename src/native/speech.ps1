[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$ErrorActionPreference = 'Stop'
try {
  Add-Type -Path (Join-Path $PSScriptRoot 'SpeechBridge.cs') -ReferencedAssemblies 'System.Speech','System.Web.Extensions'
  [SelectSpeak.SpeechBridge]::Run()
} catch {
  [Console]::Out.WriteLine((@{ type = 'error'; message = $_.Exception.Message } | ConvertTo-Json -Compress))
  exit 1
}
