#!/usr/bin/env python3
"""Sync the Notion Master Ledger database -> seed.json for the Editing Ledger site.

Runs in GitHub Actions on a schedule. Needs env vars:
  NOTION_TOKEN        - Notion internal integration secret (repo secret)
  NOTION_DATABASE_ID  - Master Ledger database id (repo variable or default below)

The Notion integration must be invited to the database (Share -> invite).
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
DATABASE_ID = os.environ.get("NOTION_DATABASE_ID", "21d09c8358cc4771859bebc2649d9d79").replace("-", "")
API = "https://api.notion.com/v1"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "seed.json")


def api(method, path, body=None):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {NOTION_TOKEN}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def plain(rich):
    return "".join(t.get("plain_text", "") for t in (rich or []))


def prop_value(prop):
    t = prop.get("type")
    if t == "title":
        return plain(prop.get("title"))
    if t in ("select", "status"):
        v = prop.get(t)
        return v.get("name") if v else ""
    if t == "date":
        v = prop.get("date")
        return (v.get("start") or "") if v else ""
    if t == "number":
        return prop.get("number")
    if t == "rich_text":
        return plain(prop.get("rich_text"))
    return ""


def norm(s):
    return "".join(c for c in s.lower() if c.isalnum() or c == " ").strip()


def main():
    if not NOTION_TOKEN:
        print("NOTION_TOKEN is missing", file=sys.stderr)
        sys.exit(1)

    db = api("GET", f"/databases/{DATABASE_ID}")
    props = db.get("properties", {})

    # Classify properties by name so column renames don't silently break the sync.
    name_key = type_key = status_key = date_key = None
    num_keys = {}
    for pname, pdef in props.items():
        n = norm(pname)
        ptype = pdef.get("type")
        if ptype == "title" and name_key is None:
            name_key = pname
        if n == "format":
            type_key = pname
        if n == "status":
            status_key = pname
        if "hand" in n and "off" in n and "date" in n:
            date_key = pname
        if ptype == "number":
            if "mins" in n or n.endswith("min"):
                num_keys["min"] = pname
            elif "secs" in n or n.endswith("sec"):
                num_keys["sec"] = pname
            elif n.endswith("ms"):
                num_keys["ms"] = pname

    print(f"mapped: name={name_key} type={type_key} status={status_key} date={date_key} nums={num_keys}")

    videos = []
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        res = api("POST", f"/databases/{DATABASE_ID}/query", body)
        for page in res.get("results", []):
            p = page.get("properties", {})
            name = prop_value(p.get(name_key, {})) if name_key else ""
            if not name:
                continue
            vtype = prop_value(p.get(type_key, {})) if type_key else "Reel"
            vtype = "YouTube" if "youtube" in str(vtype).lower() else "Reel"
            status = prop_value(p.get(status_key, {})) if status_key else "Todo"
            status = {"In Queue": "Todo"}.get(status, status)
            if status not in ("Todo", "In Progress", "Review", "Completed"):
                status = "Todo"
            date = prop_value(p.get(date_key, {})) if date_key else ""
            date = (date or "")[:10]
            created = page.get("created_time", "")
            try:
                created_ms = int(datetime.fromisoformat(created.replace("Z", "+00:00")).timestamp() * 1000)
            except Exception:
                created_ms = 0
            videos.append({
                "id": "notion-" + page.get("id", "").replace("-", ""),
                "createdAt": created_ms,
                "name": name,
                "type": vtype,
                "status": status,
                "min": int(prop_value(p.get(num_keys["min"], {})) or 0) if "min" in num_keys else 0,
                "sec": int(prop_value(p.get(num_keys["sec"], {})) or 0) if "sec" in num_keys else 0,
                "ms": int(prop_value(p.get(num_keys["ms"], {})) or 0) if "ms" in num_keys else 0,
                "dateFinished": date,
            })
        if res.get("has_more"):
            cursor = res.get("next_cursor")
        else:
            break

    videos.sort(key=lambda v: (v["createdAt"], v["name"]))
    payload = {
        "syncedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "videos": videos,
    }
    with open(OUT, "w") as f:
        json.dump(payload, f, indent=1)
    print(f"wrote {len(videos)} videos to {OUT}")


if __name__ == "__main__":
    main()
