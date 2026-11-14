"""Write docs/ISSUES.md from tasks.py, and (only if asked) create the GitHub issues.

    python scripts/issues/create_issues.py            # check the list and rewrite docs/ISSUES.md
    python scripts/issues/create_issues.py --publish  # also create the issues on GitHub (needs the gh tool)

Publishing asks you to confirm the repository first, and skips issues that already exist.
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tasks import ISSUES  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
BY_ID = {i["id"]: i for i in ISSUES}


def check():
    errors = []
    ids = [i["id"] for i in ISSUES]
    if len(set(ids)) != len(ids):
        errors.append("duplicate ids")
    for i in ISSUES:
        for field in [i["title"], i["goal"], i["time"], *i["parts"], *i["done"], *i["needs"]]:
            bad = [c for c in field if ord(c) > 127 and not 0x400 <= ord(c) <= 0x4FF]
            if bad:
                errors.append(f"issue {i['id']}: special character {bad[0]!r} in: {field[:50]}")
        if not i["parts"] or not i["done"]:
            errors.append(f"issue {i['id']}: needs parts and a 'done when'")
    return errors


def title(i):
    return f"{i['id']}. {i['title']}"


def body(i):
    lines = [
        f"**Time:** about {i['time']}",
        f"**Suggested person:** {i['who']}",
        f"**You can start with:** {i['start']}",
        "**Needs first:** " + ("; ".join(i["needs"]) if i["needs"] else "nothing"),
        "",
        "## What we build",
        i["goal"],
        "",
        "## Parts",
        *[f"- [ ] {p}" for p in i["parts"]],
        "",
        "## Done when",
        *[f"- [ ] {d}" for d in i["done"]],
        "",
        f"**Where in the code:** {i['where']}",
        "",
        "Rules: every number must come from a script. Never invent data or sources. Fake sample files must never appear in the demo.",
        f"Source: PLAN.md ({i['ref']}).",
    ]
    return "\n".join(lines)


def write_index():
    lines = [
        "# What we build, in order",
        "",
        "**Goal:** a website that introduces the fire datasets and why they matter, shows how we harmonize them "
        "(make MODIS and VIIRS comparable), and shows how the data can be used for research, with our prediction model as the example.",
        "",
        "Only [PLAN.md](../PLAN.md) is the plan. This list cuts the work into 13 jobs. "
        "Parts that are not in PLAN.md are marked EXTRA.",
        "",
        "## The 13 jobs",
        "",
        "| # | Job | About | Suggested person | Needs first |",
        "|---|---|---|---|---|",
    ]
    for i in ISSUES:
        needs = "; ".join(n.split(" (")[0].split(". ")[0] for n in i["needs"]) or "nothing"
        lines.append(f"| {i['id']} | {i['title']} | {i['time']} | {i['who']} | {needs} |")
    lines += [
        "",
        "## How to work",
        "",
        "- Jobs 1 and 2 start now. After job 1, the website jobs (3, 4, 5, 8) can run at the same time as the data jobs (2, 6).",
        "- Website jobs start with fake sample files (the `fixtures` folder). When the real files are ready, switch to them.",
        "- A job is finished when every 'Done when' line is true.",
        "- If you are stuck for more than 15 minutes, ask in the group chat.",
        "- New ideas go in `docs/parking_lot.md`. Do not add them to a job.",
        "",
    ]
    for i in ISSUES:
        lines += [f"## {title(i)}", "", body(i), ""]
    (ROOT / "docs" / "ISSUES.md").write_text("\n".join(lines), encoding="utf-8")


def gh(*args, stdin=None):
    return subprocess.run(["gh", *args], capture_output=True, text=True, encoding="utf-8", input=stdin,
                          check=True, cwd=ROOT)


def publish():
    try:
        repo = json.loads(gh("repo", "view", "--json", "nameWithOwner").stdout)["nameWithOwner"]
    except (FileNotFoundError, subprocess.CalledProcessError):
        sys.exit("The GitHub tool (gh) is missing or not logged in. Install it and run: gh auth login")
    print(f"Repository: {repo}")
    if input("Create the issues here? [y/N] ").strip().lower() != "y":
        sys.exit("Stopped. Nothing was created.")
    existing = {x["title"] for x in json.loads(gh("issue", "list", "--state", "all", "--limit", "200",
                                                  "--json", "title").stdout)}
    for i in ISSUES:
        if title(i) in existing:
            print("skip  ", title(i))
            continue
        out = gh("issue", "create", "--title", title(i), "--body-file", "-", stdin=body(i)).stdout.strip()
        print("create", out)


if __name__ == "__main__":
    errs = check()
    if errs:
        sys.exit("Problems:\n  " + "\n  ".join(errs))
    write_index()
    print(f"OK: {len(ISSUES)} issues -> docs/ISSUES.md")
    if "--publish" in sys.argv:
        publish()
