$ErrorActionPreference = "Stop"

$alias = $env:RASPBERRY_SSH_ALIAS
if (-not $alias) { $alias = "pi-remote" }

$hostName = $env:RASPBERRY_SSH_HOST
if (-not $hostName) { $hostName = "ssh.cureonics.com" }

$user = $env:RASPBERRY_SSH_USER
if (-not $user) { $user = "mahirkurt" }

$keyFile = $env:RASPBERRY_SSH_KEY
if (-not $keyFile) { $keyFile = "$env:USERPROFILE\.ssh\id_ed25519" }

$proxy = $env:RASPBERRY_PROXY_COMMAND
if (-not $proxy) { $proxy = "cloudflared access ssh --hostname $hostName" }

$configPath = "$env:USERPROFILE\.ssh\config"
if (-not (Test-Path $configPath)) {
  New-Item -ItemType File -Path $configPath -Force | Out-Null
}

$content = Get-Content -Path $configPath -Raw
if ($content -match "(?im)^Host\\s+$alias$") {
  Write-Output "SSH config already contains Host $alias."
  exit 0
}

$entry = @"
Host $alias
    HostName $hostName
    User $user
    ProxyCommand $proxy
    IdentityFile $keyFile
"@

Add-Content -Path $configPath -Value "`n$entry"
Write-Output "Added Host $alias to $configPath."
