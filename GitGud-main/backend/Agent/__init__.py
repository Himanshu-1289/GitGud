from Agent.agent import *
from fastapi import APIRouter, Depends, Request, Response, status
from Auth import get_current_user
import datetime as dt
from pymongo import ASCENDING
from Agent.models import ChatMessage
from datetime import datetime, timezone
import logging
from bson import ObjectId
from starlette.exceptions import HTTPException

agent_router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@agent_router.post("/chat_message", summary="Send a message in a chat room")
async def chat_message(
    chat_message: ChatMessage,
    chat_id: str,
    request: Request,
    response: Response,
    user=Depends(get_current_user),
):
    """
    Send a message in a chat room and generate a response from the chatbot.

    Args:
        chat_message (ChatMessage): The chat message data.
        request (Request): The HTTP request object.
        response (Response): The HTTP response object.
        user: The current user obtained from the access token.

    Returns:
        dict: The chatbot's response
    """
    try:

        # Fetch chat metadata
        chat = await request.app.database["Chat List"].find_one(
            {
                "_id": ObjectId(chat_id),
                "user_id": ObjectId(user["_id"]),
            }
        )
        if not chat:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"error": "Chat not found"}

        # Fetch all chat history sorted by timestamp DESCENDING
        chat_history = (
            await request.app.database["Messages"]
            .find(
                {
                    "chat_id": ObjectId(chat_id),
                    "user_id": ObjectId(user["_id"]),
                }
            )
            .sort("timestamp", ASCENDING)
            .to_list(length=None)
        )

        if not chat_history:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"error": "Chat History not found"}

        # 🕒 Get time difference in minutes from earliest message
        earliest_message = await request.app.database["Messages"].find_one(
            {
                "chat_id": ObjectId(chat_id),
                "user_id": ObjectId(user["_id"]),
            },
            sort=[("timestamp", ASCENDING)],
        )

        # Getting the time difference between the timestamp of the first message in chat and current time
        time_difference_minutes = None
        if earliest_message and "timestamp" in earliest_message:
            earliest_time = earliest_message["timestamp"]
            if earliest_time.tzinfo is None:
                earliest_time = earliest_time.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            diff = now - earliest_time
            time_difference_minutes = diff.total_seconds() / 60

        # Formatting chat history
        formatted_history = [
            {"role": m["role"], "content": m["message"]}
            for m in chat_history
            if m["role"] != "system"
        ]

        summary = chat.get("summary", "")
        problem = chat.get("problem_statement", "")

        # Calling Level Based Chabot
        if time_difference_minutes <= 20:
            chatbot = ChatBot(
                messages=formatted_history, summary=summary, problem=problem
            )
        elif time_difference_minutes > 20 and time_difference_minutes <= 30:
            chatbot = ChatBot(
                messages=formatted_history, summary=summary, problem=problem, level=1
            )
        elif time_difference_minutes > 30:
            chatbot = ChatBot(
                messages=formatted_history, summary=summary, problem=problem, level=2
            )
        result = await chatbot.chat(message=chat_message.message)

        # Inserting user request after successfull bot response
        await request.app.database["Messages"].insert_one(
            {
                "chat_id": ObjectId(chat_id),
                "user_id": ObjectId(user["_id"]),
                "role": "user",
                "message": chat_message.message,
                "timestamp": dt.datetime.now(timezone.utc),
            }
        )

        # Update summary
        await request.app.database["Chat List"].update_one(
            {"_id": chat_id, "email": user["email"]},
            {"$set": {"summary": result["summary"]}},
        )

        # Insert bot response
        response = await request.app.database["Messages"].insert_one(
            {
                "chat_id": ObjectId(chat_id),
                "user_id": ObjectId(user["_id"]),
                "role": "assistant",
                "message": result["response"],
                "timestamp": dt.datetime.now(timezone.utc),
            }
        )

        return {
            "message": result["response"],
        }

    except Exception as e:
        logger.error(f"Error sending message: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=500, detail=str(e))
