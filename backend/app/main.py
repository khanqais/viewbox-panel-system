from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, members, sources, surveys, referrals, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ViewBox Panel System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": "ViewBox Panel System"}
