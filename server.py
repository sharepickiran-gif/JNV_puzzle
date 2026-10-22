import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "images"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}


class PuzzleRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path == "/api/images":
            filenames = sorted(
                (
                    image.name
                    for image in IMAGE_DIR.iterdir()
                    if image.is_file()
                    and image.suffix.lower() in IMAGE_EXTENSIONS
                ),
                key=str.casefold,
            )
            payload = json.dumps(filenames).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()


def main():
    handler = partial(PuzzleRequestHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 8000), handler) as server:
        print("JNV Puzzle running at http://127.0.0.1:8000")
        print("Press Ctrl+C to stop the server.")
        server.serve_forever()


if __name__ == "__main__":
    main()
