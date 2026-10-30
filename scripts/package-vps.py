#!/usr/bin/env python3
"""Package MU H5 server + public assets for VPS deployment, with Neon kept external."""
from __future__ import annotations

import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game"
OUT = ROOT / "dist"
NAME = "MU_H5_Full_2.8_VPS_Neon_20261030.zip"
PREFIX = "MU_H5_VPS_Neon"
SKIP_DIRS = {
    ".git", "node_modules", "backups", "data", "__pycache__", ".cache",
    ".next", "coverage", "dist", ".venv", ".vscode",
}
SKIP_EXT = {".pem", ".key", ".p12", ".pfx", ".sqlite", ".sqlite3", ".db", ".log", ".7z", ".zip"}
SKIP_FILES = {"accounts.json", ".env", ".env.local", ".env.production", ".npmrc"}

def excluded(rel: Path) -> bool:
    if any(x in SKIP_DIRS for x in rel.parts):
        return True
    if any(x.startswith(".env") for x in rel.parts):
        return True
    if rel.name in SKIP_FILES or rel.suffix.lower() in SKIP_EXT:
        return True
    if rel.is_absolute() or ".." in rel.parts:
        return True
    return False

def main() -> None:
    if not (GAME / "server.cjs").is_file() or not (GAME / "package.json").is_file():
        raise SystemExit("Missing game/server.cjs or game/package.json")
    if not (GAME / "public" / "assets").is_dir():
        raise SystemExit("Missing game/public/assets")
    if not (ROOT / "VPS_INSTALL_NEON.md").is_file():
        raise SystemExit("Missing VPS_INSTALL_NEON.md")
    OUT.mkdir(exist_ok=True)
    output = OUT / NAME
    files: list[Path] = []
    total = 0
    for path in GAME.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        rel = path.relative_to(GAME)
        if excluded(rel):
            continue
        files.append(path)
        total += path.stat().st_size
    files.sort(key=lambda p: p.as_posix())
    if len(files) < 1000:
        raise SystemExit(f"Only {len(files)} files. Refusing to build incomplete asset package.")
    if not any(path.name == "manifest.json" and "mu06" in path.parts for path in files):
        raise SystemExit("Missing world manifest: refuses to package incomplete game.")
    if any("accounts.json" in p.name or ".env" in p.name for p in files):
        raise SystemExit("Secret or user-data file included: refusing to package.")
    commit = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True
    )
    revision = commit.stdout.strip() if commit.returncode == 0 else "unknown"
    metadata = {
        "source": "https://github.com/kiendt193/mu-h5",
        "revision": revision,
        "created_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "game_file_count": len(files),
        "uncompressed_game_bytes": total,
        "storage": "Neon PostgreSQL using VPS DATABASE_URL (never included)",
        "cdn": "https://mu-h5.kiendt193-fpt.workers.dev (verified release match, fallback local)",
        "requires": ["Node.js >=22", "PostgreSQL DATABASE_URL", "single active server writer"],
    }
    print(f"Packaging {len(files)} files, {total/1024**2:.1f} MiB uncompressed", flush=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=2, allowZip64=True) as archive:
        for index, file in enumerate(files, 1):
            rel = file.relative_to(GAME)
            archive.write(file, arcname=f"{PREFIX}/game/{rel.as_posix()}")
            if index % 2500 == 0:
                print(f"Packed {index}/{len(files)} files", flush=True)
        archive.writestr(f"{PREFIX}/README_VPS_NEON.md",
                         (ROOT / "VPS_INSTALL_NEON.md").read_text(encoding="utf-8"))
        archive.writestr(f"{PREFIX}/PACKAGE_INFO.json",
                         json.dumps(metadata, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(output) as archive:
        invalid = archive.testzip()
        if invalid:
            raise SystemExit(f"Broken file in ZIP: {invalid}")
        names = archive.namelist()
        assert any(s.endswith("/game/server.cjs") for s in names)
        assert any(s.endswith("/game/public/index.html") for s in names)
        assert not any("/data/" in n or n.endswith("/accounts.json") for n in names)
    print(json.dumps({
        "ok": True,
        "output": str(output),
        "zip_bytes": output.stat().st_size,
        **metadata,
    }, ensure_ascii=False), flush=True)

if __name__ == "__main__":
    main()
