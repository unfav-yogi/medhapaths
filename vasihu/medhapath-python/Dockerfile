FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persistent data directory — mount a volume here on any host that offers
# persistent storage, so medhapath.db and the session secret key survive
# restarts and redeploys. If no volume is mounted, the app still runs fine;
# it just resets to seed data whenever the container restarts.
ENV DATA_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 8000

# Shell form so $PORT expands — Render, Railway, Fly.io etc. all inject a
# PORT env var at runtime and expect the container to bind to it. Falls
# back to 8000 if nothing sets it (e.g. plain `docker run` on your own VPS).
CMD gunicorn app:app --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 60
