from typing import TypedDict, Annotated, Any
from pydantic import BaseModel, Field
from pydantic.dataclasses import dataclass
from langgraph.graph.message import add_messages


class ExtractCode(TypedDict):
    """Type class for extracting Python code."""

    validation_code: str
    extracted_code: str = Field(
        ...,
        description="Only the clean solution code (e.g., the Solution class) without any test cases.",
    )
    language: str | None = Field(
        ..., description="Enter the programming language of the code"
    )


class NoCode(TypedDict):
    """Type class for indicating no code was found."""

    no_code: bool


class JudgeOutput(TypedDict):
    """Type class for judge output."""

    passed: bool = Field(
        ...,
        description="'True' if solution code passes all test cases and 'False' if it doesn't",
    )
    advice: str = Field(..., description="Give advice on correcting the solution")


class State(TypedDict):
    """State class containing messages and extracted code."""

    messages: Annotated[list, add_messages]
    extract_code: ExtractCode | None = None


class ChatMessage(BaseModel):
    """Model for a chat message."""

    message: str

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "message": "Hello, how are you?",
                },
            ]
        }

class ChatbotCodeOutput(TypedDict):
    """Output model for the chatbot."""

    extracted_code_language: str = Field(
        ...,
        description="The programming language used for the solution (e.g., 'Python', 'Java').",
    )
    extracted_code: str = Field(
        ...,
        description="Only the clean solution code (e.g., the Solution class).",
    )
    validation_code: str = Field(
        ...,
        description="Validation Code should print/give an output 'True' if it passes all test cases",
        examples=[
            """# Python Validation Test Cases
                    print(longest_palindrome("babad") == "bab")  # Output: "True"
                    print(longest_palindrome("cbbd") == "cbbd")  # Output: "True"
                    print(longest_palindrome("") == "")  # Output: "True" (Edge case: empty string)
                    print(longest_palindrome("a") == "a")  # Output: "True" (Edge case: single character)
            """,
            """// C++ Validation Test Cases

                    int main() {
                        cout << (longest_palindrome("babad") == "bab" ? "True" : "False") << endl;  // "True"
                        cout << (longest_palindrome("cbbd") == "cbbd" ? "True" : "False") << endl;  // "True"
                        cout << (longest_palindrome("") == "" ? "True" : "False") << endl;  // "True" (Edge case: empty string)
                        cout << (longest_palindrome("a") == "a" ? "True" : "False") << endl;  // "True" (Edge case: single character)
                        return 0;
                    }
                    """,
            """// Java Validation Test Cases
                    public class Main {
                        public static void main(String[] args) {
                            System.out.println(longestPalindrome("babad").equals("bab") ? "True" : "False");  // "True"
                            System.out.println(longestPalindrome("cbbd").equals("cbbd") ? "True" : "False");  // "True"
                            System.out.println(longestPalindrome("").equals("") ? "True" : "False");  // "True" (Edge case: empty string)
                            System.out.println(longestPalindrome("a").equals("a") ? "True" : "False");  // "True" (Edge case: single character)
                        }
                    }
            """,
        ],
    )

class ReplacementOutput(BaseModel):
    """Output model for the chatbot."""

    extracted_code_explanation: str = Field(
        ...,
        description="Explanation part of the code in the message",
    )
    extracted_code: str = Field(
        ...,
        description="Solution part of the part",
    )
    

@dataclass
class AgentDeps:
    """Dependencies for the agent."""

    api_key: str
    http_client: Any

    class Config:
        arbitrary_types_allowed = True
