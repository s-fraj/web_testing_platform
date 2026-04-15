from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models, os

SECRET_KEY = os.getenv("SECRET_KEY", "mr7ai-secret-change-in-production")
ALGORITHM  = "HS256"
EXPIRE_MIN = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p): return pwd_context.hash(p)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    d = data.copy()
    d["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if uid is None: return None
        return db.query(models.User).filter(models.User.id == int(uid)).first()
    except JWTError:
        return None

def authenticate_user(db, email, password):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password): return None
    return user
