from pydantic import BaseModel
from typing import Optional


class CreateChatReqModel(BaseModel):
    """
    Model for creating a chat request containing problem URL and optional problem nickname.
    """
    problem_url : str
    problem_nickname : Optional[str] = None
    model_config = {
        "json_schema_extra":{
            "examples" : [
                {
                    "problem_url": "https://example.com/problem1",
                    "problem_nickname": "Problem 1"
                },
            ]
        }
    }