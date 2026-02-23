# CarbonacInfra CLI — Design Document

**Date:** 2026-02-23
**Status:** Implemented

## Goal

CureoHub'in SSH altyapisini (PiConnection/HPConnection) kullanarak Carbonac Docker Compose servislerini Pi ve HP uzerinde uzaktan yonetmek icin CLI araci.

## Scope

- Pi: Redis + API (profile: `pi`, port 3003)
- HP: Worker only (profile: `hp-worker`, HP Redis olarak Pi'ye baglanir)
- Islemler: start, stop, restart, status, logs

## Architecture

### File Location

`scripts/infra.py` — Carbonac repo'sunda tek dosya.

### CureoHub Dependency

CureoHub workspace sibling olarak import edilir:

```python
from pathlib import Path
import sys

# Workspace sibling: /mnt/thunderbolt/workspaces/CureoHub
_ws = Path(__file__).resolve().parent.parent.parent
_curehub = _ws / "CureoHub"
if _curehub.is_dir():
    sys.path.insert(0, str(_curehub))

from ai_hub.pi_connection import PiConnection
from ai_hub.hp_connection import HPConnection
```

### Class: CarbonacInfra

```python
class CarbonacInfra:
    # Topology constants
    PI_COMPOSE_DIR = "~/carbonac"
    HP_COMPOSE_DIR = "~/carbonac"
    PI_PROFILE = "pi"
    HP_PROFILE = "hp-worker"
    PI_ENV_FILES = ".env --env-file .env.pi"
    HP_ENV_FILES = ".env --env-file .env.hp"

    def __init__(self):
        self._pi: PiConnection | None = None
        self._hp: HPConnection | None = None

    # Lazy connection properties
    @property
    def pi(self) -> PiConnection
    @property
    def hp(self) -> HPConnection

    # Context manager
    def __enter__(self) -> CarbonacInfra
    def __exit__(self, *exc) -> None

    # Core operations
    def start_pi(self) -> str
    def stop_pi(self) -> str
    def start_hp(self) -> str
    def stop_hp(self) -> str
    def restart_pi(self) -> str
    def restart_hp(self) -> str

    # Observability
    def status(self) -> dict      # JSON: {pi: [...containers], hp: [...containers]}
    def logs_pi(self, tail=50) -> str
    def logs_hp(self, tail=50) -> str
```

### SSH Commands Executed

| Method | Node | Command |
|--------|------|---------|
| `start_pi()` | Pi | `cd ~/carbonac && docker compose --env-file .env --env-file .env.pi --profile pi up -d` |
| `stop_pi()` | Pi | `cd ~/carbonac && docker compose --profile pi down` |
| `start_hp()` | HP | `cd ~/carbonac && docker compose --env-file .env --env-file .env.hp --profile hp-worker up -d` |
| `stop_hp()` | HP | `cd ~/carbonac && docker compose --profile hp-worker down` |
| `status()` (Pi) | Pi | `cd ~/carbonac && docker compose --profile pi ps --format json` |
| `status()` (HP) | HP | `cd ~/carbonac && docker compose --profile hp-worker ps --format json` |
| `logs_pi()` | Pi | `cd ~/carbonac && docker compose --profile pi logs --tail 50` |
| `logs_hp()` | HP | `cd ~/carbonac && docker compose --profile hp-worker logs --tail 50` |

### CLI Interface

Uses `argparse` with subcommands:

```
python scripts/infra.py start-pi       # Pi: Redis + API
python scripts/infra.py start-hp       # HP: Worker
python scripts/infra.py start          # Both nodes
python scripts/infra.py stop-pi
python scripts/infra.py stop-hp
python scripts/infra.py stop           # Both nodes
python scripts/infra.py restart-pi
python scripts/infra.py restart-hp
python scripts/infra.py status         # Table output: all containers on both nodes
python scripts/infra.py logs-pi [--tail N]
python scripts/infra.py logs-hp [--tail N]
```

### Error Handling

- SSH connection failures: CureoHub's built-in fallback (tunnel -> local -> tailscale)
- Compose errors: Print stderr, exit with non-zero code
- Node unreachable: Print warning, continue with reachable node (for `status` and `start`/`stop` all)

### Output Format

- `status`: Formatted table (container name, state, ports, health)
- `start`/`stop`/`restart`: Success/failure message with stdout
- `logs`: Raw compose log output

## Dependencies

- Python 3.10+ (already available on dev machine)
- CureoHub repo at workspace sibling path (`/mnt/thunderbolt/workspaces/CureoHub`)
- CureoHub's ai_hub dependencies: `paramiko` (for SSH)

## Non-Goals

- No Streamlit dashboard (CLI only)
- No deploy/build commands (just compose up/down)
- No CureoHub repo modifications
- No health monitoring beyond `docker compose ps`
