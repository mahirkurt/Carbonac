$ErrorActionPreference = "Stop"

$profiles = $env:DOCKER_PROFILES
$composeFile = "docker-compose.yml"

if ($profiles) {
  $profileArgs = $profiles.Split(',') | ForEach-Object { "--profile $_" } | Out-String
  docker compose -f $composeFile $profileArgs up -d
} else {
  docker compose -f $composeFile up -d
}
