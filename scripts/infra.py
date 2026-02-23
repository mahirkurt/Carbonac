#!/usr/bin/env python3
"""Carbonac infrastructure CLI — manage Docker Compose on Pi/HP via CureoHub SSH."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Fix SSH key path before CureoHub config loads (config.py reads at import)
# CureoHub .env may have Windows paths; override for native Linux.
# ---------------------------------------------------------------------------
_linux_key = Path.home() / ".ssh" / "id_ed25519"
if _linux_key.exists():
    os.environ.setdefault("PI_KEY_FILENAME", str(_linux_key))
    os.environ.setdefault("HP_KEY_FILENAME", str(_linux_key))

# ---------------------------------------------------------------------------
# CureoHub ai_hub import (workspace sibling)
# ---------------------------------------------------------------------------
_ws = Path(__file__).resolve().parent.parent.parent  # /mnt/thunderbolt/workspaces
_curehub = _ws / "CureoHub"
if not _curehub.is_dir():
    _curehub = Path(os.getenv("CUREHUB_PATH", "")).expanduser().resolve()
if _curehub.is_dir():
    sys.path.insert(0, str(_curehub))
else:
    print(
        f"CureoHub not found at {_ws / 'CureoHub'} — set CUREHUB_PATH env var",
        file=sys.stderr,
    )
    sys.exit(1)

from ai_hub.pi_connection import PiConnection  # noqa: E402
from ai_hub.hp_connection import HPConnection  # noqa: E402


class CarbonacInfra:
    """Manage Carbonac Docker Compose services on Pi and HP nodes."""

    # Actual topology (matches deployed state)
    PI_COMPOSE_DIR = os.getenv("CARBONAC_PI_PATH", "~/carbonac")
    PI_COMPOSE_FILE = "docker-compose.raspberry.yml"
    PI_PROFILE = "api"
    PI_ENV_FILES = "--env-file .env"

    HP_COMPOSE_DIR = os.getenv("CARBONAC_HP_PATH", "~/projects/Carbonac")
    HP_COMPOSE_FILE = "docker-compose.yml"
    HP_PROFILE = "hp-worker"
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
            return (
                f"cd {self.PI_COMPOSE_DIR} && "
                f"docker compose -f {self.PI_COMPOSE_FILE} {self.PI_ENV_FILES} "
                f"--profile {self.PI_PROFILE} {action}"
            )
        return (
            f"cd {self.HP_COMPOSE_DIR} && "
            f"docker compose -f {self.HP_COMPOSE_FILE} {self.HP_ENV_FILES} "
            f"--profile {self.HP_PROFILE} {action}"
        )

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
