import asyncio
import httpx
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def create_token():
    to_encode = {"sub": "1"}  # admin_users id=1
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def test():
    token = create_token()
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Get projects
        r = await client.get("http://localhost:8083/api/v1/sources/12796997-9814-4c24-ba76-5362ad18867d/jobs", headers=headers)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")

asyncio.run(test())
