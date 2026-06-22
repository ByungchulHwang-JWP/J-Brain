"""Minimal test runner for local environments without pytest.

The project keeps pytest-compatible test functions under tests/. This runner
discovers zero-argument test_* functions and executes them directly so the
core regression suite can run in constrained Codex/local runtimes too.
"""

from __future__ import annotations

import argparse
import importlib.util
import inspect
from pathlib import Path
import sys
import traceback


ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "src"
TEST_DIR = ROOT / "tests"


def iter_test_files(patterns: list[str]) -> list[Path]:
    files: list[Path] = []
    for pattern in patterns:
        matched = sorted(TEST_DIR.glob(pattern))
        files.extend(path for path in matched if path.is_file())
    return sorted(set(files))


def load_module(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load test module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(patterns: list[str]) -> int:
    sys.path.insert(0, str(SRC_DIR))
    test_files = iter_test_files(patterns)
    total = 0
    passed = 0
    failed: list[tuple[str, str, BaseException]] = []
    skipped: list[tuple[str, str]] = []

    for path in test_files:
        module = load_module(path)
        for name, fn in sorted(vars(module).items()):
            if not name.startswith("test_") or not callable(fn):
                continue
            signature = inspect.signature(fn)
            if signature.parameters:
                skipped.append((path.name, name))
                continue
            total += 1
            try:
                fn()
            except Exception as exc:  # noqa: BLE001 - report any test failure.
                failed.append((path.name, name, exc))
                print(f"FAIL {path.name}::{name} - {exc!r}")
                traceback.print_exc()
            else:
                passed += 1
                print(f"PASS {path.name}::{name}")

    print(f"SUMMARY passed={passed} total={total} failed={len(failed)} skipped={len(skipped)}")
    if skipped:
        print("SKIPPED fixture_or_argument_tests=" + str(len(skipped)))
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "patterns",
        nargs="*",
        default=["test_*.py"],
        help="Glob patterns under tests/. Default: test_*.py",
    )
    args = parser.parse_args()
    return run(args.patterns)


if __name__ == "__main__":
    raise SystemExit(main())
