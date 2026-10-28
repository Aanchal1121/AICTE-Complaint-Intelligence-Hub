import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import (
    auth_router,
    complaints_router,
    institutions_router,
    network_router,
    analytics_router,
    root_cause_router,
    settings_router
)

# Create tables if not existing
Base.metadata.create_all(bind=engine)

# Auto-migrate student profile columns if missing in SQLite
with engine.connect() as conn:
    try:
        from sqlalchemy import text
        res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        col_names = [r[1] for r in res]
        for col, ctype in [
            ('enrollment_no', 'TEXT'),
            ('college_name', 'TEXT'),
            ('student_class', 'TEXT'),
            ('branch', 'TEXT'),
            ('gender', 'TEXT'),
            ('year', 'TEXT')
        ]:
            if col not in col_names:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ctype}"))
        conn.commit()
    except Exception as e:
        pass

app = FastAPI(
    title="AICTE Complaint Intelligence Hub (CIH) API",
    description="Integrated dashboard and intelligence backend for monitoring institution complaint cases across AICTE bureaus",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router)
app.include_router(complaints_router.router)
app.include_router(institutions_router.router)
app.include_router(network_router.router)
app.include_router(analytics_router.router)
app.include_router(root_cause_router.router)
app.include_router(settings_router.router)

@app.get("/")
def root():
    return {
        "app": "AICTE Complaint Intelligence Hub",
        "status": "Operational",
        "tagline": "One institution, one complaint view, across every bureau and cell",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "aicte-cih-backend"}
