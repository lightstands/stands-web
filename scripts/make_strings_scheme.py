#!/bin/python3
import re
import sys
import copy
import glob
import json
from pathlib import Path

if sys.version_info < (3, 10):
    from typing import Iterable
else:
    from collections.abc import Iterable

SLOT_REGEX = re.compile(r"(?<![a-zA-Z0-9])t\(\s*(?:\"([a-zA-Z0-9/$%@]+)\"|'([a-zA-Z0-9/$%@]+'))", re.MULTILINE)

SCHEME_TEMPLATE = {
    "$scheme": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
        "regions": {
            "type": "object",
            "paths": []
        }
    }
}

class SlotData:
    __slots__ = ("key", "path")
    def __init__(self, key: str, path: str) -> None:
        self.key = key
        self.path = path

def extract_slots(s: str, path: str) -> list[SlotData]:
    result = []
    for match in SLOT_REGEX.finditer(s):
        result.append(SlotData(match.group(1), path))
    return result

def make_scheme(slots: Iterable[SlotData]) -> dict:
    scheme = copy.deepcopy(SCHEME_TEMPLATE)
    properties = scheme["properties"]
    for slot in slots:
        if slot.key not in properties:
            properties[slot.key] = {
                "type": "string",
                "paths": [slot.path]
            }
        else:
            paths = properties[slot.key]["paths"]
            if slot.path not in paths:
                paths.append(slot.path)
    return scheme

def main(scan_path: str):
    file_paths = glob.iglob(scan_path, recursive=True)
    slots = []
    for path in map(Path, file_paths):
        if path.is_file():
            with open(path, 'r', encoding="utf8") as f:
                slots.extend(extract_slots(f.read(), str(path)))
    scheme = make_scheme(slots)
    json.dump(scheme, sys.stdout, indent=4)

def run_main():
    scan_path = sys.argv[1]
    main(scan_path)

if __name__ == "__main__":
    run_main()
