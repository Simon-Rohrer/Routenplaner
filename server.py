from __future__ import annotations

import csv
import json
import os
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parent
CSV_DIR = ROOT_DIR / "CSV"
CSV_DELIMITER = ";"

CSV_FILES = {
    "fahrer": CSV_DIR / "Fahrer.csv",
    "fahrzeuge": CSV_DIR / "Fahrzeug.csv",
    "pakete": CSV_DIR / "Paket.csv",
    "fahrten": CSV_DIR / "Fahrtenverlauf.csv",
}

TRIP_HEADERS = [
    "Fahrt_ID",
    "Datum",
    "Fahrzeug_ID",
    "Fahrer_ID",
    "Startort",
    "Zielorte",
    "Kosten_Gesamt_EUR",
]


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file, delimiter=CSV_DELIMITER)
        return [dict(row) for row in reader]


def ensure_trip_file() -> None:
    CSV_DIR.mkdir(parents=True, exist_ok=True)

    if CSV_FILES["fahrten"].exists() and CSV_FILES["fahrten"].stat().st_size > 0:
        return

    with CSV_FILES["fahrten"].open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=TRIP_HEADERS, delimiter=CSV_DELIMITER)
        writer.writeheader()


def append_trip(payload: dict[str, object]) -> dict[str, str]:
    ensure_trip_file()

    now = datetime.now()
    trip_id = f"F-{now.strftime('%Y%m%d-%H%M%S')}"
    row = {
        "Fahrt_ID": str(payload.get("fahrtId") or trip_id),
        "Datum": str(payload.get("datum") or now.date().isoformat()),
        "Fahrzeug_ID": str(payload.get("fahrzeugId") or ""),
        "Fahrer_ID": str(payload.get("fahrerId") or ""),
        "Startort": str(payload.get("startort") or ""),
        "Zielorte": str(payload.get("zielort") or ""),
        "Kosten_Gesamt_EUR": str(payload.get("kostenGesamtEur") or ""),
    }

    with CSV_FILES["fahrten"].open("a", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=TRIP_HEADERS, delimiter=CSV_DELIMITER)
        writer.writerow(row)

    return row


class CsvServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self) -> None:
        parsed_url = urlparse(self.path)

        if parsed_url.path == "/api/health":
            self.write_json({"ok": True, "csvDir": str(CSV_DIR)})
            return

        if parsed_url.path == "/api/csv":
            self.write_json(
                {
                    "fahrer": read_csv_rows(CSV_FILES["fahrer"]),
                    "fahrzeuge": read_csv_rows(CSV_FILES["fahrzeuge"]),
                    "pakete": read_csv_rows(CSV_FILES["pakete"]),
                    "fahrten": read_csv_rows(CSV_FILES["fahrten"]),
                }
            )
            return

        super().do_GET()

    def do_POST(self) -> None:
        parsed_url = urlparse(self.path)

        if parsed_url.path == "/api/fahrten":
            payload = self.read_json_body()
            row = append_trip(payload)
            self.write_json({"ok": True, "fahrt": row}, HTTPStatus.CREATED)
            return

        self.send_error(HTTPStatus.NOT_FOUND, "API route not found")

    def read_json_body(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(length).decode("utf-8") if length else "{}"

        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
            return {}

        return data if isinstance(data, dict) else {}

    def write_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        response = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def main() -> None:
    port = int(os.environ.get("PORT", "5500"))
    server = ThreadingHTTPServer(("127.0.0.1", port), CsvServerHandler)
    print(f"Serving PaketPilot on http://127.0.0.1:{port}/index.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
