$ErrorActionPreference = "Stop"

$context = $env:LOCAL_DOCKER_CONTEXT
if (-not $context) { $context = "desktop-linux" }

docker context use $context | Out-Null
Write-Output "Current docker context: $context"
