import os
import sqlite3
import json
import secrets
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, request, jsonify, session, send_from_directory, render_template

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", APP_DIR)
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "medhapath.db")

app = Flask(__name__)

SECRET_KEY_FILE = os.path.join(DATA_DIR, ".secret_key")


def get_or_create_secret_key():
    env_key = os.environ.get("SECRET_KEY")
    if env_key:
        return env_key
    if os.path.exists(SECRET_KEY_FILE):
        with open(SECRET_KEY_FILE, "r") as f:
            existing = f.read().strip()
            if existing:
                return existing
    new_key = secrets.token_hex(32)
    with open(SECRET_KEY_FILE, "w") as f:
        f.write(new_key)
    return new_key


app.secret_key = get_or_create_secret_key()
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_HTTPONLY=True,
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 7,  # 7 days
)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset=False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    is_new = not os.path.exists(DB_PATH)
    conn = get_db()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            secret_code TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT,
            course_name TEXT,
            issue_date TEXT,
            status TEXT NOT NULL DEFAULT 'AUTHORIZED'
        );

        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            accent_color TEXT DEFAULT '#C9A24B',
            overlay_text_color TEXT DEFAULT '#26200F',
            background_image TEXT,
            name_font TEXT DEFAULT 'script',
            name_x_percent REAL DEFAULT 50,
            name_y_percent REAL DEFAULT 44,
            date_x_percent REAL DEFAULT 50,
            date_y_percent REAL DEFAULT 48.6,
            id_x_percent REAL DEFAULT 6.4,
            id_y_percent REAL DEFAULT 89.9,
            is_active INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS certificates (
            certificate_code TEXT PRIMARY KEY,
            student_name TEXT NOT NULL,
            course_name TEXT,
            issue_date TEXT,
            status TEXT NOT NULL DEFAULT 'VALID'
        );

        CREATE TABLE IF NOT EXISTS workshops (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            date TEXT,
            instructor TEXT,
            duration TEXT,
            registration_form_url TEXT
        );

        CREATE TABLE IF NOT EXISTS showcase_students (
            id TEXT PRIMARY KEY,
            student_name TEXT NOT NULL,
            workshop_title TEXT,
            bio TEXT,
            linkedin_url TEXT,
            github_url TEXT,
            certificate_code TEXT
        );

        CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            workshop_id TEXT,
            workshop_title TEXT,
            full_name TEXT NOT NULL,
            email TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            organization_name TEXT,
            signatory_name TEXT,
            signatory_title TEXT
        );

        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            provider TEXT,
            link TEXT NOT NULL
        );
        """
    )
    conn.commit()

    if is_new:
        seed(conn)
    else:
        admin_row = cur.execute("SELECT COUNT(*) c FROM admin").fetchone()
        if admin_row["c"] == 0:
            print("Admin account missing from existing database — repairing it (other data left untouched).")
            seed_admin(conn)

    conn.close()


def seed_admin(conn):
    from werkzeug.security import generate_password_hash

    conn.execute(
        "INSERT INTO admin (id, email, password_hash, secret_code) VALUES (1, ?, ?, ?)",
        ("VY@gmail.com", generate_password_hash("20OCT2005"), "8125992772"),
    )
    conn.commit()


def seed(conn):
    cur = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")

    seed_admin(conn)

    students = [
        ("s1", "Yogashwar Pothuganti", "yogashwar.p@example.com", "Full-Stack Web Development", today, "AUTHORIZED"),
        ("s2", "Ananya Reddy", "ananya.reddy@example.com", "Applied Machine Learning", today, "AUTHORIZED"),
        ("s3", "Kabir Singh Mehta", "kabir.mehta@example.com", "Cloud & DevOps Foundations", today, "AUTHORIZED"),
    ]
    cur.executemany(
        "INSERT INTO students (id, full_name, email, course_name, issue_date, status) VALUES (?, ?, ?, ?, ?, ?)",
        students,
    )

    templates = [
        ("t1", "Modern Classic", "#C9A24B", "#26200F", None, "script", 50, 44, 50, 48.6, 6.4, 89.9, 1),
        ("t2", "Tech Minimalist", "#4F6FD8", "#26200F", None, "script", 50, 44, 50, 48.6, 6.4, 89.9, 0),
        ("t3", "Gold Elite", "#B8860B", "#26200F", None, "script", 50, 44, 50, 48.6, 6.4, 89.9, 0),
    ]
    cur.executemany(
        """INSERT INTO templates
           (id, name, accent_color, overlay_text_color, background_image, name_font,
            name_x_percent, name_y_percent, date_x_percent, date_y_percent, id_x_percent, id_y_percent, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        templates,
    )

    workshops = [
        ("w1", "Full-Stack Web Development", "React, Node and production deployment, start to finish.",
         "Web", "2026-07-12", "DHARMOVIX Tech Team", "6 weeks", None),
        ("w2", "Applied Machine Learning", "Practical ML pipelines with real datasets.",
         "AI/ML", "2026-07-20", "ProAca Academy", "5 weeks", None),
        ("w3", "Cloud & DevOps Foundations", "CI/CD, containers and cloud infrastructure basics.",
         "Cloud", "2026-08-02", "DHARMOVIX Tech Team", "4 weeks", None),
    ]
    cur.executemany(
        """INSERT INTO workshops (id, title, description, category, date, instructor, duration, registration_form_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        workshops,
    )

    cur.execute(
        "INSERT INTO settings (id, organization_name, signatory_name, signatory_title) VALUES (1, ?, ?, ?)",
        ("MEDHAPATH Digital Verification Authority", "V. Yogesh", "Director of Academic Certification"),
    )

    courses = [
        ("c1", "Full-Stack Web Development", "Build and deploy production web apps from scratch.",
         "Web", "DHARMOVIX Tech", "https://example.com/courses/full-stack-web-development"),
        ("c2", "Applied Machine Learning", "Practical ML pipelines using real-world datasets.",
         "AI/ML", "ProAca Academy", "https://example.com/courses/applied-machine-learning"),
    ]
    cur.executemany(
        "INSERT INTO courses (id, name, description, category, provider, link) VALUES (?, ?, ?, ?, ?, ?)",
        courses,
    )

    conn.commit()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"error": "Not authenticated."}), 401
        return fn(*args, **kwargs)
    return wrapper


def gen_id(prefix):
    return f"{prefix}_{secrets.token_hex(6)}"


def row_to_dict(row):
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.errorhandler(404)
def handle_404(e):
    # If a browser hits an unmatched /api/* route, a raw HTML "Not Found"
    # page is what causes the confusing "Login failed unexpectedly (404)"
    # message on the frontend. Return real diagnostics instead.
    if request.path.startswith("/api/"):
        return jsonify({
            "error": f"No API route matches {request.method} {request.path}.",
            "hint": (
                "If every /api/* call 404s, the Flask backend (app.py) likely isn't the "
                "thing actually serving this page — e.g. it was deployed as a static "
                "site instead of a Python web service, or you opened index.html "
                "directly instead of running `python app.py`. Run `python app.py` and "
                "open the exact URL it prints in the terminal."
            ),
        }), 404
    # Any other unmatched path (e.g. someone bookmarking a page path) still
    # serves the app shell instead of a dead end — the frontend router
    # handles which "page" to show internally.
    return render_template("index.html")


@app.errorhandler(500)
def handle_500(e):
    import traceback
    traceback.print_exc()
    if request.path.startswith("/api/"):
        return jsonify({"error": f"Server error: {e}"}), 500
    return render_template("index.html"), 500


# ---------------------------------------------------------------------------
# Stats & health
# ---------------------------------------------------------------------------

@app.route("/api/stats")
def stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) c FROM certificates").fetchone()["c"]
    valid = conn.execute("SELECT COUNT(*) c FROM certificates WHERE status='VALID'").fetchone()["c"]
    students_count = conn.execute("SELECT COUNT(*) c FROM students").fetchone()["c"]
    workshops_count = conn.execute("SELECT COUNT(*) c FROM workshops").fetchone()["c"]
    orgs = conn.execute("SELECT COUNT(DISTINCT instructor) c FROM workshops").fetchone()["c"]
    conn.close()
    return jsonify({
        "total_certificates": total,
        "valid_certificates": valid,
        "authorized_students": students_count,
        "workshops": workshops_count,
        "partner_organizations": orgs,
    })


@app.route("/api/db/health")
def db_health():
    try:
        conn = get_db()
        counts = {
            "students": conn.execute("SELECT COUNT(*) c FROM students").fetchone()["c"],
            "certificates": conn.execute("SELECT COUNT(*) c FROM certificates").fetchone()["c"],
            "templates": conn.execute("SELECT COUNT(*) c FROM templates").fetchone()["c"],
            "workshops": conn.execute("SELECT COUNT(*) c FROM workshops").fetchone()["c"],
        }
        conn.close()
        return jsonify({"status": "ok", "records": counts})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------------------------
# Admin auth
# ---------------------------------------------------------------------------

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    from werkzeug.security import check_password_hash

    try:
        body = request.get_json(force=True, silent=True) or {}
        conn = get_db()
        admin = conn.execute("SELECT * FROM admin WHERE id=1").fetchone()
        conn.close()

        if admin is None:
            # The admin row is missing — an interrupted or corrupted seed.
            # Repair just the admin account; leave any other real data alone.
            print("[admin login] admin row missing — repairing admin account")
            conn = get_db()
            seed_admin(conn)
            conn.close()
            return jsonify({
                "error": "Admin account wasn't initialized yet. It has been set up now — please try signing in again.",
            }), 503

        # Coerce to str defensively: request bodies are JSON, so these are
        # normally already strings, but a stray numeric/None value here
        # would otherwise raise and get masked as a generic 401 below.
        secret_code = body.get("secretCode")
        if secret_code is not None and str(secret_code).strip():
            secret_code = str(secret_code).strip()
            stored_code = str(admin["secret_code"] or "").strip()
            if secret_code == stored_code:
                session["is_admin"] = True
                session.permanent = True
                print("[admin login] secret code accepted")
                return jsonify({"ok": True})
            print(f"[admin login] secret code rejected: got {secret_code!r}, expected length {len(stored_code)}")
            return jsonify({"error": "Invalid secret code."}), 401

        email = str(body.get("email") or "").strip().lower()
        password = str(body.get("password") or "")
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400
        stored_email = str(admin["email"] or "").strip().lower()
        if email != stored_email:
            print(f"[admin login] email mismatch: got {email!r}, expected {stored_email!r}")
            return jsonify({"error": "Invalid email or password."}), 401
        if not check_password_hash(admin["password_hash"], password):
            print("[admin login] password check failed")
            return jsonify({"error": "Invalid email or password."}), 401

        session["is_admin"] = True
        session.permanent = True
        print("[admin login] credentials accepted")
        return jsonify({"ok": True})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error during login: {e}"}), 500


@app.route("/api/admin/me")
def admin_me():
    return jsonify({"authenticated": bool(session.get("is_admin"))})


@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.pop("is_admin", None)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Developer-only shortcut — OFF by default everywhere, including local runs.
# Only does anything if you explicitly set DEV_MODE=1 in your own
# environment. Never enable this on a deployed/public instance.
# ---------------------------------------------------------------------------

DEV_MODE = os.environ.get("DEV_MODE", "0") == "1"


@app.route("/api/dev/status")
def dev_status():
    return jsonify({"dev_mode": DEV_MODE})


@app.route("/api/dev/login", methods=["POST"])
def dev_login():
    if not DEV_MODE:
        return jsonify({"error": "Not available. Set DEV_MODE=1 in your environment to enable this locally."}), 403
    session["is_admin"] = True
    session.permanent = True
    print("[dev login] admin session created via DEV_MODE shortcut — never do this on a public deployment")
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------

@app.route("/api/students", methods=["GET"])
def list_students():
    conn = get_db()
    rows = conn.execute("SELECT * FROM students ORDER BY rowid").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/students", methods=["POST"])
@require_admin
def add_student():
    body = request.get_json(force=True, silent=True) or {}
    full_name = (body.get("full_name") or "").strip()
    if not full_name:
        return jsonify({"error": "full_name is required."}), 400

    student = {
        "id": gen_id("s"),
        "full_name": full_name,
        "email": body.get("email", ""),
        "course_name": body.get("course_name", ""),
        "issue_date": datetime.now().strftime("%Y-%m-%d"),
        "status": "AUTHORIZED",
    }
    conn = get_db()
    conn.execute(
        "INSERT INTO students (id, full_name, email, course_name, issue_date, status) VALUES (?, ?, ?, ?, ?, ?)",
        tuple(student.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(student), 201


@app.route("/api/students/<student_id>", methods=["PUT"])
@require_admin
def update_student(student_id):
    body = request.get_json(force=True, silent=True) or {}
    conn = get_db()
    existing = conn.execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Student not found."}), 404

    updated = dict(existing)
    for key in ("full_name", "email", "course_name", "status"):
        if key in body:
            updated[key] = body[key]

    conn.execute(
        "UPDATE students SET full_name=?, email=?, course_name=?, status=? WHERE id=?",
        (updated["full_name"], updated["email"], updated["course_name"], updated["status"], student_id),
    )
    conn.commit()
    conn.close()
    return jsonify(updated)


@app.route("/api/students/<student_id>", methods=["DELETE"])
@require_admin
def delete_student(student_id):
    conn = get_db()
    cur = conn.execute("DELETE FROM students WHERE id=?", (student_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        return jsonify({"error": "Student not found."}), 404
    return jsonify({"deleted": True})


@app.route("/api/students/bulk", methods=["POST"])
@require_admin
def bulk_students():
    body = request.get_json(force=True, silent=True) or {}
    rows = body.get("students", [])
    conn = get_db()
    added = []
    for r in rows:
        full_name = (r.get("full_name") or r.get("name") or "").strip()
        if not full_name:
            continue
        student = {
            "id": gen_id("s"),
            "full_name": full_name,
            "email": r.get("email", ""),
            "course_name": r.get("course_name") or r.get("course") or "",
            "issue_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "AUTHORIZED",
        }
        conn.execute(
            "INSERT INTO students (id, full_name, email, course_name, issue_date, status) VALUES (?, ?, ?, ?, ?, ?)",
            tuple(student.values()),
        )
        added.append(student)
    conn.commit()
    conn.close()
    return jsonify({"added": len(added), "students": added}), 201


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

@app.route("/api/templates", methods=["GET"])
def list_templates():
    conn = get_db()
    rows = conn.execute("SELECT * FROM templates ORDER BY rowid").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/templates", methods=["POST"])
@require_admin
def add_template():
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required."}), 400

    template = {
        "id": gen_id("t"),
        "name": name,
        "accent_color": body.get("accent_color", "#C9A24B"),
        "overlay_text_color": body.get("overlay_text_color", "#26200F"),
        "background_image": body.get("background_image"),
        "name_font": body.get("name_font", "script"),
        "name_x_percent": body.get("name_x_percent", 50),
        "name_y_percent": body.get("name_y_percent", 44),
        "date_x_percent": body.get("date_x_percent", 50),
        "date_y_percent": body.get("date_y_percent", 48.6),
        "id_x_percent": body.get("id_x_percent", 6.4),
        "id_y_percent": body.get("id_y_percent", 89.9),
        "is_active": 0,
    }
    conn = get_db()
    conn.execute(
        """INSERT INTO templates
           (id, name, accent_color, overlay_text_color, background_image, name_font,
            name_x_percent, name_y_percent, date_x_percent, date_y_percent, id_x_percent, id_y_percent, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        tuple(template.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(template), 201


@app.route("/api/templates/<template_id>", methods=["PUT"])
@require_admin
def update_template(template_id):
    body = request.get_json(force=True, silent=True) or {}
    conn = get_db()
    existing = conn.execute("SELECT * FROM templates WHERE id=?", (template_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Template not found."}), 404

    if body.get("is_active") is True:
        conn.execute("UPDATE templates SET is_active=0")
        conn.execute("UPDATE templates SET is_active=1 WHERE id=?", (template_id,))
    else:
        updated = dict(existing)
        editable = [
            "name", "accent_color", "overlay_text_color", "background_image", "name_font",
            "name_x_percent", "name_y_percent", "date_x_percent", "date_y_percent",
            "id_x_percent", "id_y_percent",
        ]
        for key in editable:
            if key in body:
                updated[key] = body[key]
        conn.execute(
            """UPDATE templates SET name=?, accent_color=?, overlay_text_color=?, background_image=?, name_font=?,
               name_x_percent=?, name_y_percent=?, date_x_percent=?, date_y_percent=?, id_x_percent=?, id_y_percent=?
               WHERE id=?""",
            (
                updated["name"], updated["accent_color"], updated["overlay_text_color"], updated["background_image"],
                updated["name_font"], updated["name_x_percent"], updated["name_y_percent"],
                updated["date_x_percent"], updated["date_y_percent"], updated["id_x_percent"], updated["id_y_percent"],
                template_id,
            ),
        )
    conn.commit()
    result = conn.execute("SELECT * FROM templates WHERE id=?", (template_id,)).fetchone()
    conn.close()
    return jsonify(dict(result))


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------

def next_certificate_code(conn):
    now = datetime.now()
    dd, mm, yyyy = now.strftime("%d"), now.strftime("%m"), now.strftime("%Y")
    fragment = f"-{dd}-{mm}-{yyyy}-"
    count = conn.execute(
        "SELECT COUNT(*) c FROM certificates WHERE certificate_code LIKE ?", (f"%{fragment}%",)
    ).fetchone()["c"] + 1
    return f"MP-{dd}-{mm}-{yyyy}-{count:03d}-VY"


@app.route("/api/certificates/generate", methods=["POST"])
def generate_certificate():
    body = request.get_json(force=True, silent=True) or {}
    full_name = body.get("full_name") or ""
    if not full_name.strip():
        return jsonify({"error": "full_name is required."}), 400

    conn = get_db()
    # Exact match only — case and spacing must match the roster exactly.
    student = conn.execute("SELECT * FROM students WHERE full_name=?", (full_name,)).fetchone()

    if not student:
        conn.close()
        return jsonify({
            "error": "NOT_AUTHORIZED",
            "message": "No authorization record matches that name exactly. Names must match the roster exactly, including capitalization and spacing.",
        }), 404

    if student["status"] == "REVOKED":
        conn.close()
        return jsonify({"error": "REVOKED", "message": "This authorization has been revoked. Contact your administrator."}), 403

    if student["status"] == "ISSUED":
        existing = conn.execute(
            "SELECT * FROM certificates WHERE student_name=? AND course_name=?",
            (student["full_name"], student["course_name"]),
        ).fetchone()
        if existing:
            conn.close()
            return jsonify({
                "error": "ALREADY_ISSUED",
                "message": "A certificate has already been issued for this name.",
                "certificate": dict(existing),
            }), 409

    code = next_certificate_code(conn)
    certificate = {
        "certificate_code": code,
        "student_name": student["full_name"],
        "course_name": student["course_name"],
        "issue_date": datetime.now().strftime("%Y-%m-%d"),
        "status": "VALID",
    }
    conn.execute(
        "INSERT INTO certificates (certificate_code, student_name, course_name, issue_date, status) VALUES (?, ?, ?, ?, ?)",
        tuple(certificate.values()),
    )
    conn.execute("UPDATE students SET status='ISSUED' WHERE id=?", (student["id"],))
    conn.commit()

    template = conn.execute("SELECT * FROM templates WHERE is_active=1").fetchone()
    if not template:
        template = conn.execute("SELECT * FROM templates LIMIT 1").fetchone()
    settings_row = conn.execute("SELECT * FROM settings WHERE id=1").fetchone()
    conn.close()

    return jsonify({
        "certificate": certificate,
        "template": dict(template) if template else None,
        "settings": dict(settings_row) if settings_row else None,
    }), 201


@app.route("/api/certificates/verify/<code>")
def verify_certificate(code):
    conn = get_db()
    cert = conn.execute(
        "SELECT * FROM certificates WHERE UPPER(certificate_code)=UPPER(?)", (code.strip(),)
    ).fetchone()
    conn.close()
    if not cert:
        return jsonify({"status": "INVALID"})
    return jsonify({"status": cert["status"], "certificate": dict(cert)})


@app.route("/api/certificates")
@require_admin
def list_certificates():
    conn = get_db()
    rows = conn.execute("SELECT * FROM certificates ORDER BY rowid DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/certificates/<code>/status", methods=["POST"])
@require_admin
def set_certificate_status(code):
    body = request.get_json(force=True, silent=True) or {}
    new_status = "REVOKED" if body.get("status") == "REVOKED" else "VALID"
    conn = get_db()
    cur = conn.execute("UPDATE certificates SET status=? WHERE certificate_code=?", (new_status, code))
    conn.commit()
    row = conn.execute("SELECT * FROM certificates WHERE certificate_code=?", (code,)).fetchone()
    conn.close()
    if cur.rowcount == 0:
        return jsonify({"error": "Certificate not found."}), 404
    return jsonify(dict(row))


# ---------------------------------------------------------------------------
# Workshops
# ---------------------------------------------------------------------------

@app.route("/api/workshops", methods=["GET"])
def list_workshops():
    conn = get_db()
    rows = conn.execute("SELECT * FROM workshops ORDER BY rowid").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/workshops", methods=["POST"])
@require_admin
def add_workshop():
    body = request.get_json(force=True, silent=True) or {}
    title = (body.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required."}), 400

    workshop = {
        "id": gen_id("w"),
        "title": title,
        "description": body.get("description", ""),
        "category": body.get("category", "General"),
        "date": body.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "instructor": body.get("instructor", ""),
        "duration": body.get("duration", ""),
        "registration_form_url": body.get("registration_form_url", ""),
    }
    conn = get_db()
    conn.execute(
        """INSERT INTO workshops (id, title, description, category, date, instructor, duration, registration_form_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        tuple(workshop.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(workshop), 201


@app.route("/api/workshops/<workshop_id>", methods=["DELETE"])
@require_admin
def delete_workshop(workshop_id):
    conn = get_db()
    conn.execute("DELETE FROM workshops WHERE id=?", (workshop_id,))
    conn.commit()
    conn.close()
    return jsonify({"deleted": True})


# ---------------------------------------------------------------------------
# Showcase
# ---------------------------------------------------------------------------

@app.route("/api/showcase", methods=["GET"])
def list_showcase():
    conn = get_db()
    rows = conn.execute("SELECT * FROM showcase_students ORDER BY rowid").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/showcase", methods=["POST"])
@require_admin
def add_showcase():
    body = request.get_json(force=True, silent=True) or {}
    student_name = (body.get("student_name") or "").strip()
    if not student_name:
        return jsonify({"error": "student_name is required."}), 400

    entry = {
        "id": gen_id("sh"),
        "student_name": student_name,
        "workshop_title": body.get("workshop_title", ""),
        "bio": body.get("bio", ""),
        "linkedin_url": body.get("linkedin_url", ""),
        "github_url": body.get("github_url", ""),
        "certificate_code": body.get("certificate_code"),
    }
    conn = get_db()
    conn.execute(
        """INSERT INTO showcase_students (id, student_name, workshop_title, bio, linkedin_url, github_url, certificate_code)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        tuple(entry.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(entry), 201


@app.route("/api/showcase/<showcase_id>", methods=["DELETE"])
@require_admin
def delete_showcase(showcase_id):
    conn = get_db()
    conn.execute("DELETE FROM showcase_students WHERE id=?", (showcase_id,))
    conn.commit()
    conn.close()
    return jsonify({"deleted": True})


# ---------------------------------------------------------------------------
# Registrations
# ---------------------------------------------------------------------------

@app.route("/api/registrations", methods=["POST"])
def add_registration():
    body = request.get_json(force=True, silent=True) or {}
    full_name = (body.get("full_name") or "").strip()
    email = (body.get("email") or "").strip()
    if not full_name or not email:
        return jsonify({"error": "full_name and email are required."}), 400

    registration = {
        "id": gen_id("r"),
        "workshop_id": body.get("workshop_id", ""),
        "workshop_title": body.get("workshop_title", ""),
        "full_name": full_name,
        "email": email,
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    conn = get_db()
    conn.execute(
        """INSERT INTO registrations (id, workshop_id, workshop_title, full_name, email, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        tuple(registration.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(registration), 201


@app.route("/api/registrations", methods=["GET"])
@require_admin
def list_registrations():
    conn = get_db()
    rows = conn.execute("SELECT * FROM registrations ORDER BY rowid DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@app.route("/api/settings", methods=["GET"])
def get_settings():
    conn = get_db()
    row = conn.execute("SELECT * FROM settings WHERE id=1").fetchone()
    conn.close()
    return jsonify(dict(row) if row else {})


@app.route("/api/settings", methods=["PUT"])
@require_admin
def update_settings():
    body = request.get_json(force=True, silent=True) or {}
    conn = get_db()
    existing = conn.execute("SELECT * FROM settings WHERE id=1").fetchone()
    updated = dict(existing) if existing else {"organization_name": "", "signatory_name": "", "signatory_title": ""}
    for key in ("organization_name", "signatory_name", "signatory_title"):
        if key in body:
            updated[key] = body[key]
    conn.execute(
        "UPDATE settings SET organization_name=?, signatory_name=?, signatory_title=? WHERE id=1",
        (updated["organization_name"], updated["signatory_name"], updated["signatory_title"]),
    )
    conn.commit()
    conn.close()
    return jsonify(updated)


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------

@app.route("/api/courses", methods=["GET"])
def list_courses():
    conn = get_db()
    rows = conn.execute("SELECT * FROM courses ORDER BY rowid").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/courses", methods=["POST"])
@require_admin
def add_course():
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get("name") or "").strip()
    link = (body.get("link") or "").strip()
    if not name or not link:
        return jsonify({"error": "name and link are required."}), 400

    course = {
        "id": gen_id("c"),
        "name": name,
        "description": body.get("description", ""),
        "category": body.get("category", ""),
        "provider": body.get("provider", ""),
        "link": link,
    }
    conn = get_db()
    conn.execute(
        "INSERT INTO courses (id, name, description, category, provider, link) VALUES (?, ?, ?, ?, ?, ?)",
        tuple(course.values()),
    )
    conn.commit()
    conn.close()
    return jsonify(course), 201


@app.route("/api/courses/<course_id>", methods=["PUT"])
@require_admin
def update_course(course_id):
    body = request.get_json(force=True, silent=True) or {}
    conn = get_db()
    existing = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Course not found."}), 404

    updated = dict(existing)
    for key in ("name", "description", "category", "provider", "link"):
        if key in body:
            updated[key] = body[key]
    conn.execute(
        "UPDATE courses SET name=?, description=?, category=?, provider=?, link=? WHERE id=?",
        (updated["name"], updated["description"], updated["category"], updated["provider"], updated["link"], course_id),
    )
    conn.commit()
    conn.close()
    return jsonify(updated)


@app.route("/api/courses/<course_id>", methods=["DELETE"])
@require_admin
def delete_course(course_id):
    conn = get_db()
    cur = conn.execute("DELETE FROM courses WHERE id=?", (course_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        return jsonify({"error": "Course not found."}), 404
    return jsonify({"deleted": True})


# ---------------------------------------------------------------------------
# Admin data reset
# ---------------------------------------------------------------------------

@app.route("/api/admin/reset-data", methods=["POST"])
@require_admin
def reset_data():
    init_db(reset=True)
    return jsonify({"reset": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"MEDHAPATH starting on http://localhost:{port}")
    print(f"Database file: {DB_PATH}")
    print(f"Admin login: VY@gmail.com / 20OCT2005  (or secret code 8125992772)")
    # use_reloader=False intentionally: the debug auto-reloader watches the
    # filesystem with inotify and can fail to start (or silently crash) on
    # systems with restricted inotify watches, which looks exactly like
    # "nothing works" from the browser. Restart the process manually after
    # editing app.py instead.
    app.run(host="0.0.0.0", port=port, debug=debug_mode, use_reloader=False)
