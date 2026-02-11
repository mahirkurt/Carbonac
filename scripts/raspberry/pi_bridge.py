#!/usr/bin/env python3
"""
Carbonac -> Raspberry bridge
Use Raspberry repo tooling to run commands remotely.
"""

import argparse
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.error import URLError
from urllib.request import Request, urlopen


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


def resolve_project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_api_base_url(override: Optional[str] = None) -> str:
    if override:
        return override
    for key in ("API_BASE_URL", "PI_API_BASE_URL"):
        value = os.getenv(key)
        if value:
            return value
    for key in ("PI_TAILSCALE_IP", "PI_LOCAL_IP", "PI_HOSTNAME"):
        value = os.getenv(key)
        if value:
            if "://" in value:
                return value
            return f"http://{value}:3001"
    return ""


def write_log_line(log_path: Path, line: str) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"{line}\n")


def wait_for_api(api_url: str, log_path: Path, timeout_seconds: int = 90, interval_seconds: int = 5) -> bool:
    if not api_url:
        return True
    base = api_url.rstrip("/")
    if base.endswith("/api"):
        health_url = f"{base}/health"
    else:
        health_url = f"{base}/api/health"
    deadline = time.time() + timeout_seconds
    write_log_line(log_path, f"health-check: {health_url}")
    while time.time() < deadline:
        try:
            request = Request(health_url, headers={"Accept": "application/json"})
            with urlopen(request, timeout=10) as response:
                if response.status == 200:
                    return True
        except URLError as error:
            write_log_line(log_path, f"health-check-error: {error}")
        time.sleep(interval_seconds)
    return False


def run_local_smoke(api_url: str, log_path: Path) -> None:
    env = os.environ.copy()
    if api_url:
        env["API_BASE_URL"] = api_url
    env.setdefault("API_SMOKE_MAX_ATTEMPTS", "300")
    env.setdefault("API_SMOKE_INTERVAL_MS", "2000")
    env.setdefault("API_SMOKE_REQUEST_TIMEOUT_MS", "20000")
    env.setdefault("API_SMOKE_DOWNLOAD_TIMEOUT_MS", "120000")
    write_log_line(
        log_path,
        "smoke: API_BASE_URL={url} API_SMOKE_MAX_ATTEMPTS={attempts} "
        "API_SMOKE_INTERVAL_MS={interval} API_SMOKE_REQUEST_TIMEOUT_MS={request_timeout} "
        "API_SMOKE_DOWNLOAD_TIMEOUT_MS={download_timeout}".format(
            url=api_url or "unset",
            attempts=env["API_SMOKE_MAX_ATTEMPTS"],
            interval=env["API_SMOKE_INTERVAL_MS"],
            request_timeout=env["API_SMOKE_REQUEST_TIMEOUT_MS"],
            download_timeout=env["API_SMOKE_DOWNLOAD_TIMEOUT_MS"],
        ),
    )
    result = subprocess.run(
        ["node", "scripts/tests/api-smoke.js"],
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.stdout:
        write_log_line(log_path, result.stdout.strip())
    if result.stderr:
        write_log_line(log_path, result.stderr.strip())
    if result.returncode != 0:
        raise SystemExit("Smoke test failed. See log for details.")


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

    deploy_smoke_parser = subparsers.add_parser(
        "deploy-smoke",
        help="Pull repo, compose up (api+worker), run smoke test, archive logs",
    )
    deploy_smoke_parser.add_argument(
        "--path",
        default=os.getenv("CARBONAC_PI_PATH", "~/carbonac"),
        help="Remote Carbonac path (default: CARBONAC_PI_PATH or ~/carbonac)",
    )
    deploy_smoke_parser.add_argument(
        "--git-url",
        default=os.getenv("CARBONAC_GIT_URL", ""),
        help="Git URL to clone if repo does not exist",
    )
    deploy_smoke_parser.add_argument(
        "--compose-file",
        default="docker-compose.raspberry.yml",
        help="Compose file name (default: docker-compose.raspberry.yml)",
    )
    deploy_smoke_parser.add_argument(
        "--profiles",
        default="api,worker",
        help="Compose profiles (comma-separated, default: api,worker)",
    )
    deploy_smoke_parser.add_argument(
        "--no-build",
        action="store_true",
        help="Skip docker compose build",
    )
    deploy_smoke_parser.add_argument(
        "--skip-smoke",
        action="store_true",
        help="Skip API smoke test after deploy",
    )
    deploy_smoke_parser.add_argument(
        "--api-url",
        default="",
        help="Override API_BASE_URL for smoke test",
    )
    deploy_smoke_parser.add_argument(
        "--log-dir",
        default=str(resolve_project_root() / "output" / "smoke"),
        help="Local log directory for smoke outputs",
    )

    return parser


def main() -> None:
    _load_carbonac_env()
    args = build_parser().parse_args()

    repo_path = resolve_raspberry_repo()
    _load_env(repo_path / ".env")
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

        if args.action == "deploy-smoke":
            remote_path = args.path
            compose_file = args.compose_file
            git_url = args.git_url
            profiles = [token.strip() for token in args.profiles.split(",") if token.strip()]

            repo_exists = pi.run(f"test -d {remote_path} && echo ok")
            if "ok" in repo_exists:
                pi.run(f"cd {remote_path} && git pull --ff-only")
            elif git_url:
                pi.run(f"git clone {git_url} {remote_path}")
            else:
                raise SystemExit("Repo not found on Pi. Provide --git-url to clone.")

            profile_flags = " ".join([f"--profile {profile}" for profile in profiles])
            build_flag = "" if args.no_build else "--build"
            compose_cmd = (
                f"cd {remote_path} && "
                f"docker compose -f {compose_file} {profile_flags} up -d {build_flag}"
            )
            deploy_output = pi.run(compose_cmd)

            timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
            log_path = Path(args.log_dir) / f"pi-deploy-{timestamp}.log"
            write_log_line(log_path, f"deploy: {compose_cmd}")
            if deploy_output:
                write_log_line(log_path, deploy_output)

            if args.skip_smoke:
                print(deploy_output)
                print(f"Smoke skipped. Log saved to {log_path}")
                return

            api_url = resolve_api_base_url(args.api_url)
            if api_url:
                ready = wait_for_api(api_url, log_path)
                if not ready:
                    write_log_line(log_path, "health-check: timeout")
                    print(f"API health check failed. Log saved to {log_path}")
                    raise SystemExit("API health check failed.")
            try:
                run_local_smoke(api_url, log_path)
            except SystemExit:
                print(f"Smoke failed. Log saved to {log_path}")
                raise

            print(deploy_output)
            print(f"Smoke passed. Log saved to {log_path}")
            return


if __name__ == "__main__":
    main()
