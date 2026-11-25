#!/usr/bin/env python3
"""Read-only Search Console CLI. Credentials and exports stay in ignored var/."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "var" / "search-console"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"


def save_private(path, text):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd, filename = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    temporary = Path(filename)
    try:
        with os.fdopen(fd, "w") as stream:
            stream.write(text)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def credentials(args):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    token = STATE / "token.json"
    if args.command == "auth":
        client = Path(args.client).expanduser()
        if not client.is_file():
            raise ValueError(f"OAuth client JSON not found: {client}")
        if "installed" not in json.loads(client.read_text()):
            raise ValueError("Create an OAuth client of type Desktop app, not Web application.")
        flow = InstalledAppFlow.from_client_secrets_file(str(client), scopes=[SCOPE])
        result = flow.run_local_server(
            host="127.0.0.1", port=0, open_browser=False, timeout_seconds=300,
            authorization_prompt_message="Open this URL in your browser:\n{url}",
            success_message="Search Console connected. You can close this tab.",
            access_type="offline", prompt="consent",)
    else:
        if not token.is_file():
            raise ValueError("Not connected. Run the auth command first; see docs/search-console.md.")
        result = Credentials.from_authorized_user_file(str(token), scopes=[SCOPE])
        if result.expired and result.refresh_token:
            result.refresh(Request())
        if not result.valid:
            raise ValueError("Authorization expired. Run auth again.")
    save_private(token, result.to_json())
    return result


def analytics(service, site, start, end, dimensions):
    rows = []
    while True:
        response = service.searchanalytics().query(siteUrl=site, body={
            "startDate": start, "endDate": end, "dimensions": dimensions,
            "type": "web", "dataState": "final", "rowLimit": 25000,
            "startRow": len(rows),
        }).execute()
        batch = response.get("rows", [])
        rows.extend(batch)
        if len(batch) < 25000:
            return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", default="https://pubsetup.com/")
    commands = parser.add_subparsers(dest="command", required=True)
    auth = commands.add_parser("auth", help="Authorize in browser with read-only scope")
    auth.add_argument("--client", default=str(STATE / "client.json"))
    commands.add_parser("sites", help="List accessible Search Console properties")
    commands.add_parser("sitemaps", help="Read submitted sitemap status")
    export = commands.add_parser("export", help="Save performance data as local JSON")
    export.add_argument("--days", type=int, default=28)
    export.add_argument("--end", help="Last date, YYYY-MM-DD; defaults to today minus 3 days")
    inspect = commands.add_parser("inspect", help="Read Google's stored index status (not a live test)")
    inspect.add_argument("url")
    args = parser.parse_args()
    if args.command == "export" and args.days < 1:
        parser.error("--days must be positive")
    from googleapiclient.discovery import build
    service = build("searchconsole", "v1", credentials=credentials(args), cache_discovery=False)
    if args.command in ("auth", "sites"):
        print(json.dumps(service.sites().list().execute(), ensure_ascii=False, indent=2))
    elif args.command == "sitemaps":
        print(json.dumps(service.sitemaps().list(siteUrl=args.site).execute(), ensure_ascii=False, indent=2))
    elif args.command == "inspect":
        result = service.urlInspection().index().inspect(body={
            "inspectionUrl": args.url, "siteUrl": args.site, "languageCode": "ru-RU",
        }).execute()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "export":
        end = dt.date.fromisoformat(args.end) if args.end else dt.date.today() - dt.timedelta(days=3)
        start = end - dt.timedelta(days=args.days - 1)
        result = {"site": args.site, "start": start.isoformat(), "end": end.isoformat(),
                  "note": "Final web data. API returns top rows; query privacy and API limits apply.",
                  "reports": {}}
        for label, dimensions in [("totals", []), ("dates", ["date"]), ("pages", ["page"]),
                                  ("queries", ["query"]), ("page_queries", ["page", "query"]),
                                  ("countries", ["country"]), ("devices", ["device"])]:
            result["reports"][label] = analytics(service, args.site, str(start), str(end), dimensions)
            print(f"{label}: {len(result['reports'][label])} rows")
        import hashlib
        site_id = hashlib.sha256(args.site.encode()).hexdigest()[:10]
        target = STATE / "exports" / f"{site_id}-{start}-{end}.json"
        save_private(target, json.dumps(result, ensure_ascii=False, indent=2))
        print(f"Saved: {target}")


if __name__ == "__main__":
    try:
        main()
    except ModuleNotFoundError:
        sys.exit("Install dependencies: var/search-console/venv/bin/pip install -r scripts/requirements-search-console.txt")
    except Exception as error:
        # Do not print HTTP response bodies, OAuth codes or tokens.
        status = getattr(getattr(error, "resp", None), "status", None)
        if isinstance(error, ValueError):
            sys.exit(str(error))
        sys.exit(f"Search Console failed ({type(error).__name__}{', HTTP ' + str(status) if status else ''}). Check API access and authorization.")
