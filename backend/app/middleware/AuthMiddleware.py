from fastapi import Request, HTTPException, status, Depends
from app.core.security import verify_token

async def auth_middleware(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token")

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    request.state.user_id = payload["sub"]
    return payload["sub"]
