# CarbonacInfra CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** CLI tool that manages Carbonac Docker Compose services on Pi/HP via CureoHub's SSH infrastructure.

**Architecture:** Single file `scripts/infra.py` containing `CarbonacInfra` class + argparse CLI. Imports `PiConnection`/`HPConnection` from CureoHub's `ai_hub` package (workspace sibling). Lazy SSH connections, context manager support, compose-profile-based topology.

**Tech Stack:** Python 3.10+, argparse, CureoHub ai_hub (PiConnection, HPConnection), paramiko (transitive)

**Design doc:** `docs/plans/2026-02-23-infra-cli-design.md`

**Existing reference:** `scripts/raspberry/pi_bridge.py` (uses old Raspberry repo — this replaces it with CureoHub)

---

### Task 1: Create `scripts/infra.py` with CureoHub imports and CarbonacInfra class skeleton

**Files:**
- Create: `scripts/infra.py`

**Step 1: Write the file with imports, class skeleton, and CLI parser**

```python
#!/usr/bin/env python3
"""Carbonac infrastructure CLI — manage Docker Compose on Pi/HP via CureoHub SSH."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# CureoHub ai_hub import (workspace sibling)
# ---------------------------------------------------------------------------
_ws = Path(__file__).resolve().parent.parent.parent  # /mnt/thunderbolt/workspaces
_curehub = _ws / "CureoHub"
if not _curehub.is_dir():
    # Fallback: check CUREHUB_PATH env var
    _curehub = Path(os.getenv("CUREHUB_PATH", "")).expanduser().resolve()
if _curehub.is_dir():
    sys.path.insert(0, str(_curehub))
else:
    print(f"CureoHub not found at {_ws / 'CureoHub'} — set CUREHUB_PATH env var", file=sys.stderr)
    sys.exit(1)

from ai_hub.pi_connection import PiConnection  # noqa: E402
from ai_hub.hp_connection import HPConnection   # noqa: E402


class CarbonacInfra:
    """Manage Carbonac Docker Compose services on Pi and HP nodes."""

    PI_COMPOSE_DIR = os.getenv("CARBONAC_PI_PATH", "~/carbonac")
    HP_COMPOSE_DIR = os.getenv("CARBONAC_HP_PATH", "~/carbonac")
    PI_PROFILE = "pi"
    HP_PROFILE = "hp-worker"
    PI_ENV_FILES = "--env-file .env --env-file .env.pi"
    HP_ENV_FILES = "--env-file .env --env-file .env.hp"

    def __init__(self) -> None:
        self._pi: PiConnection | None = None
        self._hp: HPConnection | None = None

    # -- lazy connections --------------------------------------------------

    @property
    def pi(self) -> PiConnection:
        if self._pi is None:
            self._pi = PiConnection()
            self._pi.connect()
        return self._pi

    @property
    def hp(self) -> HPConnection:
        if self._hp is None:
            self._hp = HPConnection()
            self._hp.connect()
        return self._hp

    # -- context manager ---------------------------------------------------

    def __enter__(self) -> CarbonacInfra:
        return self

    def __exit__(self, *exc: object) -> None:
        if self._pi is not None:
            self._pi.disconnect()
        if self._hp is not None:
            self._hp.disconnect()

    # -- helpers -----------------------------------------------------------

    def _run_pi(self, cmd: str) -> str:
        stdout, stderr = self.pi.run_command(cmd)
        if stderr and stderr.strip():
            print(stderr, file=sys.stderr)
        return stdout

    def _run_hp(self, cmd: str) -> str:
        stdout, stderr = self.hp.run_command(cmd)
        if stderr and stderr.strip():
            print(stderr, file=sys.stderr)
        return stdout

    def _compose_cmd(self, node: str, action: str) -> str:
        if node == "pi":
            return f"cd {self.PI_COMPOSE_DIR} && docker compose {self.PI_ENV_FILES} --profile {self.PI_PROFILE} {action}"
        return f"cd {self.HP_COMPOSE_DIR} && docker compose {self.HP_ENV_FILES} --profile {self.HP_PROFILE} {action}"

    # -- core operations ---------------------------------------------------

    def start_pi(self) -> str:
        return self._run_pi(self._compose_cmd("pi", "up -d"))

    def stop_pi(self) -> str:
        return self._run_pi(self._compose_cmd("pi", "down"))

    def start_hp(self) -> str:
        return self._run_hp(self._compose_cmd("hp", "up -d"))

    def stop_hp(self) -> str:
        return self._run_hp(self._compose_cmd("hp", "down"))

    def restart_pi(self) -> str:
        self.stop_pi()
        return self.start_pi()

    def restart_hp(self) -> str:
        self.stop_hp()
        return self.start_hp()

    # -- observability -----------------------------------------------------

    def status_pi(self) -> str:
        return self._run_pi(self._compose_cmd("pi", "ps"))

    def status_hp(self) -> str:
        return self._run_hp(self._compose_cmd("hp", "ps"))

    def status(self) -> None:
        errors: list[str] = []
        print("=== Pi (Redis + API) ===")
        try:
            print(self.status_pi())
        except Exception as exc:
            errors.append(f"Pi: {exc}")
            print(f"  Connection failed: {exc}", file=sys.stderr)

        print("\n=== HP (Worker) ===")
        try:
            print(self.status_hp())
        except Exception as exc:
            errors.append(f"HP: {exc}")
            print(f"  Connection failed: {exc}", file=sys.stderr)

        if errors:
            sys.exit(1)

    def logs_pi(self, tail: int = 50) -> str:
        return self._run_pi(self._compose_cmd("pi", f"logs --tail {tail}"))

    def logs_hp(self, tail: int = 50) -> str:
        return self._run_hp(self._compose_cmd("hp", f"logs --tail {tail}"))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="infra",
        description="Manage Carbonac Docker Compose on Pi/HP via CureoHub SSH",
    )
    sub = parser.add_subparsers(dest="action", required=True)

    sub.add_parser("start-pi", help="Start Pi services (Redis + API)")
    sub.add_parser("start-hp", help="Start HP services (Worker)")
    sub.add_parser("start", help="Start both Pi and HP")
    sub.add_parser("stop-pi", help="Stop Pi services")
    sub.add_parser("stop-hp", help="Stop HP services")
    sub.add_parser("stop", help="Stop both Pi and HP")
    sub.add_parser("restart-pi", help="Restart Pi services")
    sub.add_parser("restart-hp", help="Restart HP services")
    sub.add_parser("status", help="Show container status on both nodes")

    logs_pi = sub.add_parser("logs-pi", help="Show Pi compose logs")
    logs_pi.add_argument("--tail", type=int, default=50, help="Number of log lines (default: 50)")

    logs_hp = sub.add_parser("logs-hp", help="Show HP compose logs")
    logs_hp.add_argument("--tail", type=int, default=50, help="Number of log lines (default: 50)")

    return parser


def main() -> None:
    args = build_parser().parse_args()

    with CarbonacInfra() as infra:
        if args.action == "start-pi":
            print(infra.start_pi())
        elif args.action == "start-hp":
            print(infra.start_hp())
        elif args.action == "start":
            print(infra.start_pi())
            print(infra.start_hp())
        elif args.action == "stop-pi":
            print(infra.stop_pi())
        elif args.action == "stop-hp":
            print(infra.stop_hp())
        elif args.action == "stop":
            print(infra.stop_pi())
            print(infra.stop_hp())
        elif args.action == "restart-pi":
            print(infra.restart_pi())
        elif args.action == "restart-hp":
            print(infra.restart_hp())
        elif args.action == "status":
            infra.status()
        elif args.action == "logs-pi":
            print(infra.logs_pi(tail=args.tail))
        elif args.action == "logs-hp":
            print(infra.logs_hp(tail=args.tail))


if __name__ == "__main__":
    main()
```

**Step 2: Verify the file is syntactically valid**

Run: `python3 -c "import ast; ast.parse(open('scripts/infra.py').read()); print('OK')"`
Expected: `OK`

**Step 3: Verify CureoHub import path resolution works**

Run: `python3 -c "import sys; sys.path.insert(0, '/mnt/thunderbolt/workspaces/CureoHub'); from ai_hub.pi_connection import PiConnection; print('import OK')"`
Expected: `import OK`

**Step 4: Test CLI help output**

Run: `python3 scripts/infra.py --help`
Expected: Shows usage with all subcommands (start-pi, start-hp, start, stop-pi, stop-hp, stop, restart-pi, restart-hp, status, logs-pi, logs-hp)

Run: `python3 scripts/infra.py start-pi --help`
Expected: Shows help for start-pi

**Step 5: Commit**

```bash
git add scripts/infra.py
git commit -m "feat(infra): add CarbonacInfra CLI for Docker Compose management via CureoHub SSH"
```

---

### Task 2: Smoke test — verify SSH connectivity and compose status

This task validates the tool works end-to-end against real Pi/HP nodes.

**Step 1: Test status command (connects to both nodes)**

Run: `python3 scripts/infra.py status`
Expected: Shows container table from Pi and HP (or connection error if nodes unavailable)

**Step 2: Test start-pi**

Run: `python3 scripts/infra.py start-pi`
Expected: Docker compose output showing Redis + API containers starting

**Step 3: Verify with status**

Run: `python3 scripts/infra.py status`
Expected: Pi containers show "running" state

**Step 4: Test logs-pi**

Run: `python3 scripts/infra.py logs-pi --tail 20`
Expected: Last 20 lines of Pi compose logs

**Step 5: If all works, commit any adjustments**

If any command paths or env files needed adjustment during testing, update and commit:

```bash
git add scripts/infra.py
git commit -m "fix(infra): adjust compose paths/profiles after live testing"
```

---

### Task 3: Update documentation

**Files:**
- Modify: `CLAUDE.md` — add infra CLI to commands section
- Modify: `docs/plans/2026-02-23-infra-cli-design.md` — mark status as Implemented

**Step 1: Add to CLAUDE.md commands section**

After the Docker section in Common Commands, add:

```bash
# Infrastructure management (Pi/HP via CureoHub SSH)
python3 scripts/infra.py start-pi       # Pi: Redis + API
python3 scripts/infra.py start-hp       # HP: Worker
python3 scripts/infra.py start          # Both nodes
python3 scripts/infra.py stop           # Both nodes
python3 scripts/infra.py status         # Container status on both nodes
python3 scripts/infra.py logs-pi        # Pi compose logs
python3 scripts/infra.py logs-hp        # HP compose logs
```

**Step 2: Update design doc status**

Change `**Status:** Approved` to `**Status:** Implemented` in `docs/plans/2026-02-23-infra-cli-design.md`

**Step 3: Commit**

```bash
git add CLAUDE.md docs/plans/2026-02-23-infra-cli-design.md
git commit -m "docs: add infra CLI usage to CLAUDE.md, mark design as implemented"
```
