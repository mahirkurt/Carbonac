$ErrorActionPreference = "Stop"

$context = $env:RASPBERRY_DOCKER_CONTEXT
if (-not $context) { $context = "raspberry" }

$alias = $env:RASPBERRY_SSH_ALIAS
if (-not $alias) { $alias = "pi-remote" }

$existing = docker context ls --format "{{.Name}}" | Select-String -SimpleMatch $context
if (-not $existing) {
  docker context create $context --docker "host=ssh://$alias" | Out-Null
  Write-Output "Created docker context: $context"
} else {
  Write-Output "Docker context already exists: $context"
}

docker context use $context | Out-Null
Write-Output "Current docker context: $context"
