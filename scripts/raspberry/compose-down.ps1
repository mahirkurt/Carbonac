$ErrorActionPreference = "Stop"

$composeFile = "docker-compose.raspberry.yml"
docker compose -f $composeFile down
