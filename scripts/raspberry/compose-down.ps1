$ErrorActionPreference = "Stop"

$composeFile = "docker-compose.yml"
docker compose -f $composeFile down
