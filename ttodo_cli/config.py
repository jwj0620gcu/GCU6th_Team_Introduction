from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path


DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_CONFIG_PATH = Path.home() / ".config" / "kanban" / "config.toml"


@dataclass(slots=True)
class Settings:
    base_url: str = DEFAULT_BASE_URL
    api_key: str = ""
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS
    config_path: Path = DEFAULT_CONFIG_PATH


def _normalize_base_url(value: str) -> str:
    return value.rstrip("/")


def load_settings(config_path: Path | None = None) -> Settings:
    path = config_path or DEFAULT_CONFIG_PATH
    data: dict[str, object] = {}
    if path.exists():
        data = tomllib.loads(path.read_text(encoding="utf-8"))

    base_url = str(data.get("base_url", DEFAULT_BASE_URL))
    api_key = str(data.get("api_key", ""))
    timeout_seconds = float(data.get("timeout_seconds", DEFAULT_TIMEOUT_SECONDS))

    # Env override priority
    base_url = os.getenv("KANBAN_BASE_URL", base_url)
    api_key = os.getenv("KANBAN_API_KEY", api_key)
    timeout_raw = os.getenv("KANBAN_TIMEOUT_SECONDS")
    if timeout_raw:
        timeout_seconds = float(timeout_raw)

    return Settings(
        base_url=_normalize_base_url(base_url),
        api_key=api_key,
        timeout_seconds=timeout_seconds,
        config_path=path,
    )


def write_settings(
    path: Path,
    base_url: str,
    api_key: str,
    timeout_seconds: float,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    body = (
        "# kanban CLI configuration\n"
        f'base_url = "{_normalize_base_url(base_url)}"\n'
        f'api_key = "{api_key}"\n'
        f"timeout_seconds = {timeout_seconds}\n"
    )
    path.write_text(body, encoding="utf-8")


def masked_key(raw: str) -> str:
    if not raw:
        return ""
    if len(raw) <= 8:
        return "*" * len(raw)
    return f"{raw[:4]}...{raw[-4:]}"
