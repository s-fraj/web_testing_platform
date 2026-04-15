from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
import models, schemas, crud, auth, scanner
from database import SessionLocal, engine
import json, asyncio, os

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="mr7.ai API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = auth.verify_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

async def get_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ── AUTH ──────────────────────────────────────────────────────────────
@app.post("/auth/signup", response_model=schemas.UserOut, status_code=201)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@app.post("/auth/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Account suspended")
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user

# ── SCAN ──────────────────────────────────────────────────────────────
@app.post("/scan/start", response_model=schemas.ScanOut, status_code=201)
def start_scan(payload: schemas.ScanCreate, db: Session = Depends(get_db),
               current_user=Depends(get_current_user)):
    # Validate URL
    from utils import is_valid_url
    if not is_valid_url(payload.target_url):
        raise HTTPException(status_code=400, detail="Invalid URL format")
    scan = crud.create_scan(db, payload, current_user.id)
    return scan

@app.get("/scan/{scan_id}/stream")
async def stream_scan(scan_id: int, db: Session = Depends(get_db),
                      token: str = None):
    # Token passed as query param for EventSource
    user = auth.verify_token(token, db) if token else None
    if not user:
        raise HTTPException(status_code=401)
    scan = crud.get_scan(db, scan_id)
    if not scan or scan.user_id != user.id:
        raise HTTPException(status_code=404)

    async def event_generator():
        async for event in scanner.run_all_tests(scan.target_url, scan_id, db):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)
        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.get("/scan/history", response_model=list[schemas.ScanOut])
def get_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.get_scans_by_user(db, current_user.id)

@app.get("/scan/{scan_id}", response_model=schemas.ScanDetailOut)
def get_scan_detail(scan_id: int, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    scan = crud.get_scan(db, scan_id)
    if not scan or (scan.user_id != current_user.id and not current_user.is_admin):
        raise HTTPException(status_code=404)
    return scan

@app.get("/scan/{scan_id}/report")
def download_report(scan_id: int, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    scan = crud.get_scan(db, scan_id)
    if not scan or (scan.user_id != current_user.id and not current_user.is_admin):
        raise HTTPException(status_code=404)
    path = crud.generate_report(scan)
    return FileResponse(path, filename=f"mr7_report_{scan_id}.txt",
                        media_type="text/plain")

# ── ADMIN ─────────────────────────────────────────────────────────────
@app.get("/admin/users", response_model=list[schemas.AdminUserOut])
def admin_users(db: Session = Depends(get_db), admin=Depends(get_admin)):
    return crud.get_all_users(db)

@app.get("/admin/scans", response_model=list[schemas.ScanOut])
def admin_scans(db: Session = Depends(get_db), admin=Depends(get_admin)):
    return crud.get_all_scans(db)

@app.post("/admin/users/{user_id}/ban")
def ban_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_admin)):
    return crud.toggle_ban(db, user_id)

@app.delete("/admin/scans/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db), admin=Depends(get_admin)):
    crud.delete_scan(db, scan_id)
    return {"ok": True}
