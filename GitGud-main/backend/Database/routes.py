from fastapi import APIRouter, Response, status, Request, Depends, Query
import logging
from Database.models import *
from Auth import *
from utils import scraper
import datetime as dt
from datetime import timezone
from Agent.agent import ChatBot

db_router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@db_router.post("/create_chat", summary="Create a new chat room for a leetcode problem")
async def create_chat(
    chat: CreateChatReqModel,
    request: Request,
    response: Response,
    user=Depends(get_current_user),
):
    """
    Create a new chat room for a given LeetCode problem.

    Args:
        chat (CreateChatReqModel): The chat creation data.
        request (Request): The HTTP request object.
        response (Response): The HTTP response object.
        user: The current user obtained from the access token.

    Returns:
        dict: A message indicating the success of the chat creation.
    """
    try:
        problem_url = chat.problem_url
        problem_nickname = chat.problem_nickname
        problem_statement = scraper(problem_url)
        messages = [{"role": "user", "content": "Explain me the problem"}]
        if not problem_statement:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"error": "Invalid problem URL"}
        if problem_nickname:
            chatbot = ChatBot(messages=messages, summary="", problem=problem_statement)
            result = await chatbot.chat()
            resp = await request.app.database["Chat List"].insert_one(  
                {
                    "problem": problem_nickname,
                    "user_id": user["_id"],
                    "problem_statement": problem_statement,
                    "summary": "",
                }
            )
            await request.app.database["Messages"].insert_one(
                {
                    "chat_id": resp.inserted_id,
                    "user_id": ObjectId(user["_id"]),
                    "role": "assistant",
                    "message": result["response"],
                    "timestamp": dt.datetime.now(timezone.utc),
                }
            )
            return {"message": "Chat created successfully", "chat_id": str(resp.inserted_id)}
        else:
            chatbot = ChatBot(messages=messages, summary="", problem=problem_statement)
            result = await chatbot.chat()
            resp = await request.app.database["Chat List"].insert_one(
                {
                    "problem": problem_url,
                    "user_id": user["_id"],
                    "problem_statement": problem_statement,
                    "summary": "",
                }
            )
            await request.app.database["Messages"].insert_one(
                {
                    "chat_id": resp.inserted_id,
                    "user_id": ObjectId(user["_id"]),
                    "role": "assistant",
                    "message": result["response"],
                    "timestamp": dt.datetime.now(timezone.utc),
                }
            )
            return {"message": "Chat created successfully", "chat_id": str(resp.inserted_id)}
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))


@db_router.get("/messages", summary="Get chat history for a leetcode problem")
async def get_messages(
    chat_id : str, request: Request, response: Response, user=Depends(get_current_user)
):
    """
    Retrieve the chat history for a given LeetCode problem.

    Args:
        chat (ChatRoom): The chat room data.
        request (Request): The HTTP request object.
        response (Response): The HTTP response object.
        user: The current user obtained from the access token.

    Returns:
        dict: The chat history for the specified problem.
    """
    try:
        chat_history = request.app.database["Messages"].find(
            {"chat_id": ObjectId(chat_id), "user_id": ObjectId(user["_id"])}
        )
        chat_history_list = await chat_history.to_list(length=1000)
        for message in chat_history_list:
            message["_id"] = str(message["_id"])
            message["chat_id"] = str(message["chat_id"])
            message["user_id"] = str(message["user_id"])
        if not chat_history_list:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"error": "Chat not found"}
        return chat_history_list
    except Exception as e:
        logger.error(f"Error retrieving chat: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))


@db_router.get("/chats", summary="Get chat lists for a user")
async def get_chats(
    request: Request, response: Response, user=Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, gt=0, le=100)
):
    """
    Retrieve the chat lists for a given LeetCode problem.

    Args:
        request (Request): The HTTP request object.
        response (Response): The HTTP response object.
        user: The current user obtained from the access token.
        skip: for pagination where the it starts
        limit: number of chats that can be sent

    Returns:
        dict: The chat lists for a user.
    """

    try:
        chats = request.app.database["Chat List"].find(
            {"user_id": ObjectId(user["_id"])}
        ).skip(skip).limit(limit)
        chat_lists = await chats.to_list()
        for chat in chat_lists:
            chat["_id"] = str(chat["_id"])
            chat["user_id"] = str(chat["user_id"])
        return chat_lists
    except Exception as e:
        logger.error(f"Error retreving chat lists")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))
        
        
@db_router.get('/len_chat', summary = "Get Chat lists for a user")
async def get_length(request: Request, response: Response,user = Depends(get_current_user)):
    try:
        chats = request.app.database["Chat List"].find(
            {"user_id":ObjectId(user["_id"])}
        )
        chats_list = await chats.to_list()
        return{
            "length":len(chats_list)
        }
    except Exception as e:
        logger.error(f"Error retreiving chat lists")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500,detail = str(e))
