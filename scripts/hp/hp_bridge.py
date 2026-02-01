#!/usr/bin/env python3
"""
Carbonac -> HP Thin Client bridge
Run commands remotely via SSH over Tailscale.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional


def _load_env(path: Path, overwrite: bool = False) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key and (overwrite or key not in os.environ):
            os.environ[key] = value


def _load_carbonac_env() -> None:
    env_path = os.getenv("CARBONAC_ENV_PATH")
    if env_path:
        _load_env(Path(env_path))
        return
    carbonac_root = Path(__file__).resolve().parents[2]
    _load_env(carbonac_root / ".env")


def resolve_hp_host() -> str:
    """Resolve HP host address (Tailscale hostname or IP)."""
    for key in ("HP_TAILSCALE_HOSTNAME", "HP_TAILSCALE_IP", "HP_SSH_HOST"):
        value = os.getenv(key)
        if value:
            return value
    return "hp-tailscale"


def resolve_ssh_user() -> str:
    """Resolve SSH user for HP connection."""
    return os.getenv("HP_SSH_USER", os.getenv("USER", "mahirkurt"))


def ssh_command(host: str, user: str, command: str, timeout: int = 60) -> str:
    """Execute SSH command on HP host."""
    ssh_args = [
        "ssh",
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
        f"{user}@{host}",
        command,
    ]
    result = subprocess.run(
        ssh_args,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if result.returncode != 0:
        if result.stderr:
            print(f"SSH Error: {result.stderr}", file=sys.stderr)
        raise SystemExit(f"Command failed with exit code {result.returncode}")
    return result.stdout


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run commands on HP Thin Client via SSH")
    subparsers = parser.add_subparsers(dest="action", required=True)

    # Status
    subparsers.add_parser("status", help="Check HP connection and system status")

    # Run
    run_parser = subparsers.add_parser("run", help="Run a shell command")
    run_parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to run")

    # Docker
    docker_parser = subparsers.add_parser("docker", help="Run docker command")
    docker_parser.add_argument("command", nargs=argparse.REMAINDER, help="Docker args")

    # Compose
    compose_parser = subparsers.add_parser("compose", help="Run docker compose command")
    compose_parser.add_argument(
        "--path",
        default=os.getenv("CARBONAC_HP_PATH", "~/carbonac"),
        help="Remote Carbonac path",
    )
    compose_parser.add_argument("command", nargs=argparse.REMAINDER, help="Compose args")

    # Deploy
    deploy_parser = subparsers.add_parser("deploy", help="Deploy to HP via compose")
    deploy_parser.add_argument(
        "--path",
        default=os.getenv("CARBONAC_HP_PATH", "~/carbonac"),
        help="Remote Carbonac path",
    )
    deploy_parser.add_argument(
        "--profile",
        default="worker",
        help="Compose profile (default: worker)",
    )
    deploy_parser.add_argument(
        "--no-build",
        action="store_true",
        help="Skip docker build",
    )

    # Logs
    logs_parser = subparsers.add_parser("logs", help="View container logs")
    logs_parser.add_argument(
        "--service",
        default="",
        help="Service name (empty for all)",
    )
    logs_parser.add_argument(
        "--tail",
        default="100",
        help="Number of lines (default: 100)",
    )

    # Tailscale
    subparsers.add_parser("tailscale-status", help="Check Tailscale status on HP")

    return parser


def main() -> None:
    _load_carbonac_env()
    args = build_parser().parse_args()

    host = resolve_hp_host()
    user = resolve_ssh_user()

    print(f"Connecting to {user}@{host}...")

    if args.action == "status":
        print("=== System Status ===")
        print(ssh_command(host, user, "uname -a && uptime && free -h"))
        print("\n=== Docker Status ===")
        print(ssh_command(host, user, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"))
        return

    if args.action == "run":
        if not args.command:
            raise SystemExit("Missing command")
        command = " ".join(args.command)
        print(ssh_command(host, user, command))
        return

    if args.action == "docker":
        if not args.command:
            raise SystemExit("Missing docker command")
        command = "docker " + " ".join(args.command)
        print(ssh_command(host, user, command))
        return

    if args.action == "compose":
        if not args.command:
            raise SystemExit("Missing compose command")
        remote_path = args.path
        command = f"cd {remote_path} && docker compose " + " ".join(args.command)
        print(ssh_command(host, user, command, timeout=300))
        return

    if args.action == "deploy":
        remote_path = args.path
        profile = args.profile
        build_flag = "" if args.no_build else "--build"

        # Git pull
        print("Pulling latest code...")
        print(ssh_command(host, user, f"cd {remote_path} && git pull --ff-only"))

        # Compose up
        print(f"Deploying with profile: {profile}...")
        command = (
            f"cd {remote_path} && "
            f"docker compose -f docker-compose.raspberry.yml "
            f"--profile {profile} up -d {build_flag}"
        )
        print(ssh_command(host, user, command, timeout=600))

        # Status
        print("\n=== Deployment Complete ===")
        print(ssh_command(host, user, "docker ps --format 'table {{.Names}}\t{{.Status}}'"))
        return

    if args.action == "logs":
        service = args.service
        tail = args.tail
        service_arg = service if service else ""
        command = f"docker compose logs --tail={tail} {service_arg}"
        print(ssh_command(host, user, command, timeout=30))
        return

    if args.action == "tailscale-status":
        print("=== Tailscale Status ===")
        print(ssh_command(host, user, "tailscale status"))
        print("\n=== Tailscale IP ===")
        print(ssh_command(host, user, "tailscale ip"))
        return


if __name__ == "__main__":
    main()
