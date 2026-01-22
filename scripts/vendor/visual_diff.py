#!/usr/bin/env python3
import argparse
import json
from PIL import Image, ImageChops


def main():
    parser = argparse.ArgumentParser(description="Visual diff for PNG files")
    parser.add_argument("baseline", help="Path to baseline PNG")
    parser.add_argument("current", help="Path to current PNG")
    parser.add_argument("--diff", required=True, help="Path to diff PNG output")
    parser.add_argument("--threshold", type=float, default=0.1, help="Diff threshold 0-1")
    args = parser.parse_args()

    baseline = Image.open(args.baseline).convert("RGB")
    current = Image.open(args.current).convert("RGB")

    if baseline.size != current.size:
        result = {
            "sizeMismatch": {
                "baseline": list(baseline.size),
                "current": list(current.size),
            }
        }
        print(json.dumps(result))
        return

    diff = ImageChops.difference(baseline, current)
    diff_gray = diff.convert("L")
    threshold_value = max(0, min(1, args.threshold)) * 255

    data = diff_gray.getdata()
    mismatch = 0
    for value in data:
        if value > threshold_value:
            mismatch += 1

    total = baseline.size[0] * baseline.size[1]
    ratio = mismatch / total if total else 0

    diff.save(args.diff)

    result = {
        "mismatchPixels": mismatch,
        "mismatchRatio": ratio,
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
