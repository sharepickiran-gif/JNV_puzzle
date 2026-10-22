import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "images"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}


def main():
    parser = argparse.ArgumentParser(
        description="Generate a JSON manifest of supported puzzle images."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "images.json",
        help="Path to write the manifest (default: images.json in this folder).",
    )
    args = parser.parse_args()

    filenames = sorted(
        (
            image.name
            for image in IMAGE_DIR.iterdir()
            if image.is_file() and image.suffix.lower() in IMAGE_EXTENSIONS
        ),
        key=str.casefold,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(filenames, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(filenames)} image paths to {args.output}")


if __name__ == "__main__":
    main()
