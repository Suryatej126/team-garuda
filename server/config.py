import os
from dotenv import load_dotenv

load_dotenv()
# Load .env file from the server directory explicitly if run from elsewhere
config_dir = os.path.dirname(os.path.abspath(__file__))
server_env = os.path.join(config_dir, ".env")
if os.path.exists(server_env):
    load_dotenv(server_env, override=True)

# Support both full DATABASE_URL (Neon/Render style) or individual parts
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "54321")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "123456")
    DB_NAME = os.getenv("DB_NAME", "team_garuda")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Fix for SQLAlchemy — it requires 'postgresql://' not 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure database host can be resolved even if local ISP DNS refuses .tech domains
def _ensure_resolvable_db_url(url: str) -> str:
    import socket
    import urllib.request
    import json
    from urllib.parse import urlparse

    if not url or "sqlite" in url:
        return url
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        if not host or host in ("localhost", "127.0.0.1"):
            return url
        if "hostaddr=" in (parsed.query or ""):
            return url
        try:
            socket.gethostbyname(host)
            return url
        except Exception:
            # Fallback to Google DNS-over-HTTPS
            doh_url = f"https://dns.google/resolve?name={host}&type=A"
            req = urllib.request.Request(doh_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode())
                answers = data.get("Answer", [])
                ips = [a["data"] for a in answers if a.get("type") == 1]
                if ips:
                    sep = "&" if "?" in url else "?"
                    print(f"INFO: Using DoH resolved hostaddr {ips[0]} for host {host}")
                    return f"{url}{sep}hostaddr={ips[0]}"
    except Exception as e:
        print(f"Warning: DNS hostaddr fallback error: {e}")
    return url

DATABASE_URL = _ensure_resolvable_db_url(DATABASE_URL)

JWT_SECRET = os.getenv("JWT_SECRET", "garuda_super_secret_jwt_key_2026_india_team")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Storage configuration: 'local', 's3', 'supabase'
STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local")

# Local Storage settings
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CORS origins — includes localhost and vercel apps by default
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://team-garuda.vercel.app",
]
env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(set(default_origins + env_origins))
