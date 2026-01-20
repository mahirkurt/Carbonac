#!/usr/bin/env python3
"""
Carbonac -> Raspberry bridge
Use Raspberry repo tooling to run commands remotely.
"""

import argparse
import os
import sys
from pathlib import Path


def resolve_raspberry_repo() -> Path:
    env_path = os.getenv("RASPBERRY_REPO_PATH")
    if env_path:
        return Path(env_path).expanduser().resolve()
    carbonac_root = Path(__file__).resolve().parents[2]
    return (carbonac_root.parent / "Raspberry").resolve()


def ensure_repo_path(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Raspberry repo not found: {path}")
    sys.path.insert(0, str(path))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run commands on Raspberry via PiManager")
    subparsers = parser.add_subparsers(dest="action", required=True)

    subparsers.add_parser("status", help="Print system status")

    run_parser = subparsers.add_parser("run", help="Run a raw shell command")
    run_parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to run on Pi")

    docker_parser = subparsers.add_parser("docker", help="Run a docker command on Pi")
    docker_parser.add_argument("command", nargs=argparse.REMAINDER, help="Docker args (e.g. ps -a)")

    compose_parser = subparsers.add_parser("compose", help="Run docker compose in a remote path")
    compose_parser.add_argument(
        "--path",
        default=os.getenv("CARBONAC_PI_PATH", "~/carbonac"),
        help="Remote Carbonac path (default: CARBONAC_PI_PATH or ~/carbonac)",
    )
    compose_parser.add_argument("command", nargs=argparse.REMAINDER, help="Compose args (e.g. up -d)")

    deploy_parser = subparsers.add_parser("deploy-worker", help="Build + run worker via compose")
    deploy_parser.add_argument(
        "--path",
        default=os.getenv("CARBONAC_PI_PATH", "~/carbonac"),
        help="Remote Carbonac path (default: CARBONAC_PI_PATH or ~/carbonac)",
    )
    deploy_parser.add_argument(
        "--git-url",
        default=os.getenv("CARBONAC_GIT_URL", ""),
        help="Git URL to clone if repo does not exist",
    )
    deploy_parser.add_argument(
        "--compose-file",
        default="docker-compose.raspberry.yml",
        help="Compose file name (default: docker-compose.raspberry.yml)",
    )
    deploy_parser.add_argument(
        "--profile",
        default="worker",
        help="Compose profile to use (default: worker)",
    )
    deploy_parser.add_argument(
        "--no-build",
        action="store_true",
        help="Skip docker compose build",
    )

    return parser


def main() -> None:
    args = build_parser().parse_args()

    repo_path = resolve_raspberry_repo()
    ensure_repo_path(repo_path)

    from pi_manager import PiManager  # pylint: disable=import-error

    with PiManager() as pi:
        if args.action == "status":
            pi.status()
            return

        if args.action == "run":
            if not args.command:
                raise SystemExit("Missing command for run")
            command = " ".join(args.command)
            print(pi.run(command))
            return

        if args.action == "docker":
            if not args.command:
                raise SystemExit("Missing command for docker")
            command = " ".join(args.command)
            print(pi.run(f"docker {command}"))
            return

        if args.action == "compose":
            if not args.command:
                raise SystemExit("Missing command for compose")
            command = " ".join(args.command)
            remote_path = args.path
            print(pi.run(f"cd {remote_path} && docker compose {command}"))
            return

        if args.action == "deploy-worker":
            remote_path = args.path
            compose_file = args.compose_file
            profile = args.profile
            git_url = args.git_url

            repo_exists = pi.run(f"test -d {remote_path} && echo ok")
            if "ok" in repo_exists:
                pi.run(f"cd {remote_path} && git pull --ff-only")
            elif git_url:
                pi.run(f"git clone {git_url} {remote_path}")
            else:
                raise SystemExit("Repo not found on Pi. Provide --git-url to clone.")

            build_flag = "" if args.no_build else "--build"
            command = (
                f"cd {remote_path} && "
                f"docker compose -f {compose_file} --profile {profile} up -d {build_flag}"
            )
            print(pi.run(command))
            return


if __name__ == "__main__":
    main()
