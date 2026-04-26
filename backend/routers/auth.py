from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import jwt
from datetime import datetime, timedelta
import os
from pydantic import BaseModel

import models, database

router = APIRouter(prefix="/auth", tags=["auth"])

# Use environment variables, fallback for local dev
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")[0]
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey_change_in_production")

config_data = {
    'GOOGLE_CLIENT_ID': GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': GOOGLE_CLIENT_SECRET,
}
starlette_config = Config(environ=config_data)

oauth = OAuth(starlette_config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

@router.get("/google/login")
async def login_via_google(request: Request):
    if not GOOGLE_CLIENT_ID:
        # For development when no keys are set, create a mock login
        token = create_access_token({"sub": "dev_user@example.com", "name": "Dev User"})
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?token={token}")
        
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(database.get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not authorize Google token.")
        
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Could not retrieve user info.")
    
    email = user_info.get("email")
    google_id = user_info.get("sub")
    name = user_info.get("name")
    picture = user_info.get("picture")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            google_id=google_id,
            name=name,
            picture=picture
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Generate our own application JWT
    access_token = create_access_token({"sub": str(user.id), "email": user.email, "name": user.name})
    
    # Redirect back to frontend with token
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?token={access_token}")

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.get("/me")
async def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "picture": current_user.picture
    }

class ProfilePictureUpdate(BaseModel):
    picture: str

@router.put("/me/picture")
async def update_profile_picture(payload: ProfilePictureUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    current_user.picture = payload.picture
    db.commit()
    return {"message": "Profile picture updated"}
