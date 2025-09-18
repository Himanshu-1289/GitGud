from fastapi import APIRouter, Response, status, Request, Depends
from Auth.models import *
from Auth import *
from starlette.exceptions import HTTPException
from fastapi import APIRouter, Response, status, Request, Depends
from Auth.models import *
from Auth import *
from starlette.exceptions import HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_router = APIRouter()

@auth_router.post(
    "/register",
    summary="Register user and return JWT tokens",
)
async def register(user: RegisterReqModel, response: Response, request: Request):
    """
    Register a new user and generate JWT tokens.

    Args:
        user (RegisterReqModel): The user registration data.
        response (Response): The HTTP response object.
        request (Request): The HTTP request object.

    Returns:
        AuthResModel: The access and refresh tokens for the user.
    """
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": await get_hashed_password(user.password),
    }
    Users = request.app.database["Users"]
    user_db = await get_user(request.app.database, user_data["email"])
    if user_db:
        return {"message": "User already exists"}
    try:
        db = await Users.insert_one(user_data)
        user_db = await get_user(request.app.database, user_data["email"])
    except Exception as e:
        logger.error(f"Error inserting user: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"error": "Error inserting user"}

    return AuthResModel(
        REFRESH_TOKEN=await create_refresh_token(str(user_db["_id"])),
        ACCESS_TOKEN=await create_access_token(str(user_db["_id"])),
    )


@auth_router.post(
    "/login",
    summary="Login user and return JWT Tokens",
)
async def login(login_data: LoginReqModel, response: Response, request: Request):
    """
    Authenticate a user and generate JWT tokens.

    Args:
        login_data (LoginReqModel): The user login data.
        response (Response): The HTTP response object.
        request (Request): The HTTP request object.

    Returns:
        AuthResModel: The access and refresh tokens for the user.
    """
    try:
        Users = request.app.database["Users"]
        user = await get_user(request.app.database,login_data.email)
        if not user:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"error": "User does not exist or could not be found"}

        if not await verify_password(hashed_pass = user["password"], password=login_data.password):
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {"error": "Invalid password"}

        return AuthResModel(
            REFRESH_TOKEN=await create_refresh_token(str(user["_id"])),
            ACCESS_TOKEN=await create_access_token(str(user["_id"])),
        )
    except Exception as e:
        logger.error(f"Error during login: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.post("/refresh", summary="Refresh JWT tokens")
async def refresh_token(response: Response, user=Depends(get_current_user_refresh)):
    """
    Refresh the JWT access token using a refresh token.

    Args:
        response (Response): The HTTP response object.
        user: The current user obtained from the refresh token.

    Returns:
        dict: The new access token.
    """
    try:
        user_id = str(user["_id"])
        if not user_id:
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {"error": "Invalid refresh token"}
        return {
            "ACCESS_TOKEN": await create_access_token(user_id),
            "REFRESH_TOKEN":await create_refresh_token(user_id)
        }
    except Exception as e:
        logger.error(f"Error during token refresh: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))