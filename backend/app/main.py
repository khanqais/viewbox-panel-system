import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, members, sources, surveys, referrals, admin, meta_leads

# Ensure database tables exist safely on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(title="ViewBox Panel System")

# CORS setup: Support local dev, custom domain via env var, and Vercel domains
env_origins = os.getenv("ALLOWED_ORIGINS", "")
parsed_origins = [o.strip() for o in env_origins.split(",") if o.strip()]

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if parsed_origins:
    allowed_origins.extend(parsed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(sources.router)
app.include_router(surveys.router)
app.include_router(referrals.router)
app.include_router(admin.router)
app.include_router(meta_leads.router)


@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ViewBox Panel System"}
