# MEDHAPATH — Digital Certificate Platform (Python + HTML + SQLite)

A complete rebuild of MEDHAPATH with **no JavaScript build step and no Node.js required**:
- **Backend**: Python (Flask)
- **Frontend**: plain HTML + CSS + vanilla JavaScript (`static/app.js`) — no React, no JSX, no bundler
- **Database**: a real SQLite file (`medhapath.db`), created and seeded automatically the first time you run it

## Requirements

- Python 3.9+
- pip

## Setup & run

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000** in your browser. That's it — one process serves both the API and the frontend, no separate dev server, no build step.

The first run creates `medhapath.db` in this folder and seeds it with demo students, templates, and workshops. Every admin action (add a student, upload a template, revoke a certificate, etc.) writes straight to that SQLite file, so your data survives restarts.

## Admin access

- Email: `VY@gmail.com` / Password: `20OCT2005`
- or Secret code: `8125992772`

Change these in `app.py` inside the `seed()` function before deploying anywhere real. The session
secret key is generated once and saved to `.secret_key` in this folder (or set a `SECRET_KEY`
environment variable instead) — this keeps admin sessions stable across server restarts instead of
silently logging everyone out every time you stop and re-run `python app.py`.

The admin page has no top navigation — reach it via the small unlabeled dot at the far right of the
navbar, or the "Admin" link in the footer. Once signed in, the only way out of the admin portal is
the **Sign out** button in the sidebar.

If a login ever fails, check the terminal running `python app.py` — every login attempt prints a
one-line reason (wrong email, wrong password, wrong code, or success) to help you debug quickly.

### Optional: local developer shortcut

For faster iteration while building locally, you can enable a one-click admin shortcut that skips
the login form entirely — **off by default, and safe to leave off**. To turn it on:

```bash
DEV_MODE=1 python app.py
```

With that flag set, a tiny invisible button appears in the bottom-right corner of the home page
that logs you straight into the admin portal. Without the flag (the default, and what you get from
`python app.py` alone, and what Render's `render.yaml` uses), that button doesn't render at all, and
the underlying endpoint refuses the request even if called directly.

**Never set `DEV_MODE=1` on a public or deployed instance.** It bypasses authentication entirely for
anyone who finds the button — which is trivial via the browser's "View Page Source." This is meant
purely for your own local machine while developing.

## What's real here

- **Database**: every student, template, certificate, workshop, showcase profile, registration, and setting lives in `medhapath.db`, a genuine SQLite file you can open with any SQLite browser (e.g. `sqlite3 medhapath.db` or DB Browser for SQLite).
- **Auth**: admin login checks a password hash (via Werkzeug's `generate_password_hash`/`check_password_hash`) or a secret code, and uses Flask's signed session cookie — no client-side-only "fake" auth.
- **Certificate matching**: exact, case- and spacing-sensitive name matching against the authorized roster, same as specified.
- **Templates**: admins upload a certificate background image (stored as base64 directly in the database); only the student's name, issue date, and unique ID overlay on top, at whatever position you set with the sliders — with a live preview showing exactly where they'll land.
- **Export**: PNG/PDF export opens the rendered certificate in a new browser tab (bypassing sandboxed-iframe download restrictions), where you can save the image or use your browser's print-to-PDF.

## Deploying this — and why some hosts won't work

This is a real, stateful Python server with a SQLite file it reads and writes on every request.
That means it needs a host that runs a **long-running Python process with disk access** — not a
static-file host and not a serverless-functions platform. Concretely:

**Will work, no code changes needed:**
Render, Railway, Fly.io, PythonAnywhere, DigitalOcean App Platform, a plain VPS (with `gunicorn` +
optionally `nginx`/`systemd`), or literally anywhere that can run a **Docker container** — which is
most hosts. A `Dockerfile` and `docker-compose.yml` are included for this.

**Will NOT work, and no configuration fixes it:**
Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any other static/serverless-function host. These
either serve static files only, or run code as short-lived functions with no persistent disk — this
app's `/api/*` routes and its SQLite file need a process that stays running and a disk that stays
around between requests. Getting this working on one of those specifically would mean rewriting the
backend as serverless functions *and* moving the database off local disk to a network-reachable one
(e.g. Turso, Postgres, etc.) — a genuinely different architecture, not a config tweak. Ask if you
want that route and I'll build it, but it's a bigger change than it might look like.

### Deploy anywhere with Docker (recommended, works almost everywhere)

```bash
docker build -t medhapath .
docker run -p 8000:8000 -v medhapath-data:/app/data medhapath
```

or with Docker Compose (same thing, simpler):

```bash
docker compose up --build
```

Then open `http://localhost:8000`. The `-v` volume (or the `volumes:` entry in
`docker-compose.yml`) is what makes `medhapath.db` and the session secret key survive container
restarts — without it, the container still runs fine, it just resets to seed data every time it
restarts.

Most container-hosting platforms (Render, Railway, Fly.io, DigitalOcean, AWS/GCP/Azure container
services) will build this `Dockerfile` automatically if you point them at this folder — look for a
"Deploy from Dockerfile" or "Deploy from GitHub" option and make sure it's set to persist a volume
at `/app/data` if you want data to survive redeploys.

### Render specifically (native Python, no Docker needed)

`render.yaml` in this folder already configures this end-to-end — Render will detect it
automatically if you connect this repo/folder as a **Web Service** (not "Static Site", that's the
mistake that causes the exact 404 you might have seen). It installs `requirements.txt`, runs
`gunicorn`, and mounts a persistent disk at the path `DATA_DIR` points to, so `medhapath.db` survives
redeploys without needing Docker at all.



Admin → Settings → "Reset all data", or delete `medhapath.db` and restart the server (it will reseed automatically).

## If login or the site doesn't seem to work

This was a real bug in an earlier version: Flask's debug auto-reloader (which watches files with
`inotify`) can fail to start the server at all on systems with restricted file-watch limits — from
the browser this looks exactly like "nothing works," including login. The reloader is now disabled
(`use_reloader=False`) and the app runs with `debug=False` by default, which fixes this. If you want
live-reload during development anyway, run `FLASK_DEBUG=1 python app.py` and restart manually after
each code change instead of relying on the auto-reloader.

## Project structure

```
app.py                 Flask app: every route, SQLite schema, seeding
requirements.txt        Python dependencies (just Flask + Werkzeug)
templates/
  index.html            HTML shell + all CSS (no separate stylesheet)
static/
  app.js                The entire frontend: routing, all pages, admin portal, canvas certificate rendering
  img/                   Logos and background images used across the site
medhapath.db            Created automatically on first run (not included — see below)
```

## Note on the included database file

`medhapath.db` **is included** in this zip, already created and seeded with the demo dataset (3
students, 3 templates, 3 workshops) — same as what runs automatically on first launch. Delete it and
restart the server any time to get a completely fresh, empty-of-your-edits copy; it will reseed itself
automatically.
