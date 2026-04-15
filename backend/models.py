from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(100), unique=True, nullable=False)
    email      = Column(String(255), unique=True, nullable=False)
    password   = Column(String(255), nullable=False)
    is_admin   = Column(Boolean, default=False)
    is_banned  = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    scans      = relationship("Scan", back_populates="user")

class Scan(Base):
    __tablename__ = "scans"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_url  = Column(String(2048), nullable=False)
    status      = Column(String(20), default="pending")   # pending / running / done / error
    results     = Column(JSON, nullable=True)              # full results JSON
    risk_score  = Column(Integer, default=0)               # 0-100
    created_at  = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    user        = relationship("User", back_populates="scans")
