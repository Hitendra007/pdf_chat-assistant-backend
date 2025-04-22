# app/api/v1/auth.py

from fastapi import APIRouter, HTTPException, Response, status, Request,Depends
from datetime import timedelta
from sqlalchemy import select
from uuid import uuid4
from app.middleware.AuthMiddleware import auth_middleware

from app.core.security import (
    get_password_hash,
    verify_password,
    create_token,
    verify_token,
)
from app.core.settings import settings
from app.db.session import SessionLocal
from app.db import models
from app.utils.apiResponse import ApiResponse

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(email: str, password: str):
    async with SessionLocal() as db:
        result = await db.execute(
            select(models.User).where(models.User.email == email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user = models.User(
            id=uuid4(),
            email=email,
            password=get_password_hash(password)
        )
        db.add(user)
        await db.commit()

        return {"message": "User registered successfully"}


@router.post("/login")
async def login(response: Response, email: str, password: str):
    async with SessionLocal() as db:
        result = await db.execute(
            select(models.User).where(models.User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

    access_token = create_token(
        {"sub": str(user.id)},
        timedelta(days=settings.ACCESS_TOKEN_EXPIRE)
    )
    refresh_token = create_token(
        {"sub": str(user.id)},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE)
    )

    response.set_cookie(
        "access_token", access_token,
        httponly=True, secure=True, samesite="Lax"
    )
    response.set_cookie(
        "refresh_token", refresh_token,
        httponly=True, secure=True, samesite="Lax"
    )

    return ApiResponse(
        status.HTTP_200_OK,
        "Logged in successfully",
        data={"user_id": str(user.id), "email": user.email,"access_token":access_token}
    ).to_dict()


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    new_access = create_token(
        {"sub": payload["sub"]},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    response.set_cookie(
        "access_token", new_access,
        httponly=True, secure=True, samesite="Lax"
    )

    return ApiResponse(
        status.HTTP_200_OK,
        "Access token refreshed"
    ).to_dict()


@router.post("/logout",dependencies=[Depends(auth_middleware)])
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return ApiResponse(
        status.HTTP_200_OK,
        "Logged out successfully"
    ).to_dict()
