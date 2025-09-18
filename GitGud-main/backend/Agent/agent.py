"""
This module defines the ChatBot class, which handles the logic for the competitive programming assistant.

It includes methods for summarizing conversations, interacting with models, and executing code.
"""

import os
import re
import requests
from dotenv import load_dotenv
from typing import List, Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from Agent.reflection_agent import create_reflection_graph
from Agent.models import *
from langchain_core.messages import AIMessage, HumanMessage
from httpx import AsyncClient
from pydantic_ai import Agent
from Agent.prompts import *


class ChatBot:
    """
    A chatbot for assisting with competitive programming problems.

    Attributes:
        messages (List[Dict[str, str]]): The conversation history.
        problem (str): The problem description.
        summary (str): A summary of the conversation.
        level (int): The assistance level (0, 1, or 2).
    """

    def __init__(
        self,
        messages: List[Dict[str, str]],
        problem: str,
        summary: str | None = None,
        level: int = 0,
    ):
        load_dotenv()
        self._messages = messages
        self._problem = problem.strip()
        self._summary = summary
        self._level = level
        self._API_KEY = os.getenv("GROQ_API_KEY")
        self._EXECUTE_URL = os.getenv("CODE_RUNNER_API_URL")
        assert self._API_KEY, "Missing GROQ_API_KEY in .env"
        assert self._EXECUTE_URL, "Missing CODE_RUNNER_API_URL in .env"

        self._extractor_model: Agent[None, ChatbotCodeOutput]
        self._chat_model: Agent[None, str]
        self._code_replacement_model: Agent[None, ReplacementOutput]
        self._judge_model: Agent[None, JudgeOutput]
        self._deps = AgentDeps(api_key=self._API_KEY, http_client=AsyncClient)
        self._chat_settings = {"temperature": 0.3}
        self._judge_settings = {"temperature": 0.3}
        self._replacement_settings = {"temperature": 0.8}
        self._summarizer_settings = {"temperature": 0.4,"seed":432}
        self._original_response = [False, ""]

    async def should_run(
        self, state: Dict[str, Any]
    ) -> Literal["summarize", "call_model"]:
        print("DEBUG: Entering should_run")
        decision = "summarize" if len(state["messages"]) > 10 else "call_model"
        print("DEBUG: Exiting should_run")
        return decision

    async def summarize(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("DEBUG: Entering summarize")
        print("Entering summarize")
        self._chat_model = Agent(
            model="groq:qwen-qwq-32b",
            system_prompt=SUMMARIZER_PROMPT,
            model_settings=self._summarizer_settings,
            deps_type=AgentDeps,
        )
        # Making chat history into strings
        chat_history = ""
        for m in state["messages"]:
            if type(m) == HumanMessage:
                chat_history += "User: " + m.text() + "\n"
            elif type(m) == AIMessage:
                chat_history += "Assistant: " + m.text() + "\n"
        result = await self._chat_model.run(
            "Summarize the following:\n" + chat_history, deps=self._deps
        )
        self._summary = "Summary of chat history" + result.output
        print("Exiting summary")
        print("DEBUG: Exiting summarize")
        return state

    async def call_model(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("DEBUG: Entering call_model")
        chat_history = ""
        if self._summary:
            chat_history += "The below is the chat history:\n"
            for m in state["messages"]:
                if type(m) == HumanMessage:
                    chat_history += "User: " + m.text() + "\n"
                elif type(m) == AIMessage:
                    chat_history += "Assistant: " + m.text() + "\n"

        FINAL_SYSTEM_PROMPT = (
            SYSTEM_PROMPT[self._level]
            + "\n\nProblem:\n"
            + self._problem
            + self._summary
            if self._summary == ""
            else chat_history
        )
        self._chat_model = Agent(
            model="groq:meta-llama/llama-4-scout-17b-16e-instruct",
            system_prompt=FINAL_SYSTEM_PROMPT,
            model_settings=self._chat_settings,
            deps_type=AgentDeps,
        )
        chat_result = await self._chat_model.run(
            state["messages"][-1].content, deps=self._deps
        )

        state["messages"].append({"role": "assistant", "content": chat_result.output})
        self._original_response[0] = True
        self._original_response[1] += chat_result.output

        self._extractor_model = Agent(
            model="groq:meta-llama/llama-4-scout-17b-16e-instruct",
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            model_settings=self._chat_settings,
            deps_type=AgentDeps,
            output_type=ChatbotCodeOutput,
        )

        extractor_result = await self._extractor_model.run(
            state["messages"][-1]["content"], deps=self._deps
        )
        if (
            type(extractor_result.output) == ChatbotCodeOutput
            and extractor_result.output["extracted_code"].lower() == "python"
        ):
            state["extract_code"] = ExtractCode(
                extracted_code=extractor_result.output["extracted_code"],
                validation_code=extractor_result.output["validation_code"],
                language=extractor_result.output["extracted_code_language"],
            )

        print("DEBUG: Exiting call_model")
        return state

    async def try_running(self, state: Dict[str, Any]) -> Dict[str, Any]:
        print("DEBUG: Entering try_running")
        if state["extract_code"]:
            resp = requests.post(
                self._EXECUTE_URL,
                json={
                    "code": state["extract_code"]["extracted_code"]+"\n\n\n"+state["extract_code"]["validation_code"],
                    "language": state["extract_code"]["language"],
                },
            )
            result = resp.json()
            print(result)
            if resp.status_code == 200:
                output = result.get("output")
            else:
                output = result

            self._judge_model = Agent(
                model="groq:meta-llama/llama-4-scout-17b-16e-instruct",
                system_prompt=JUDGE_SYSTEM_PROMPT,
                output_type=JudgeOutput,
                model_settings=self._judge_settings,
                deps_type=AgentDeps,
            )

            judge_result = await self._judge_model.run(
                user_prompt="Code:\n"
                + state["extract_code"]["extracted_code"]+"\n\n\n"+state["extract_code"]["validation_code"]
                + "\nOutput"
                + (output or "Error"),
                deps=self._deps,
            )
            print(judge_result.output)
            if not judge_result.output["passed"]:
                state["messages"].append(
                    {
                        "role": "user",
                        "content": f"This solution code is incorrect, as i get the incorrect output: "
                        + output
                        + "\nHere's my advice on correcting it: \n"
                        + judge_result.output["advice"],
                    }
                )
            else:
                self._code_replacement_model = Agent(
                    model="groq:meta-llama/llama-4-scout-17b-16e-instruct",
                    system_prompt=CODE_REPLACEMENT_PROMPT,
                    model_settings=self._replacement_settings,
                    output_type = ReplacementOutput,
                    deps_type=AgentDeps
                )
                prompt = "Original:\n"+self._original_response[1]+"\n\nUser-Provided Code:\n\n"+state["extract_code"]["extracted_code"]
                replacement_result = await self._code_replacement_model.run(prompt)
                state["messages"].append({
                    "role":"assistant",
                    "content":'```python\n'+replacement_result.output.extracted_code+"```\n\n\n"+replacement_result.output.extracted_code_explanation
                })
                self._original_response[0] = False
            state["extract_code"] = None
        print("DEBUG: Exiting try_running")
        return state

    async def create_reflection(self):
        print("DEBUG: Entering create_reflection")
        agent_graph = (
            StateGraph(State)
            .add_node(self.summarize, "summarize")
            .add_node(self.call_model, "call_model")
            .add_conditional_edges(START, self.should_run)
            .add_edge("summarize", "call_model")
            .add_edge("call_model", END)
            .compile()
        )
        judge_graph = (
            StateGraph(State)
            .add_node(self.try_running, "try_running")
            .add_edge(START, "try_running")
            .add_edge("try_running", END)
            .compile()
        )
        reflection_graph = create_reflection_graph(agent_graph, judge_graph).compile()
        print("DEBUG: Exiting create_reflection")
        return reflection_graph

    async def create_agent(self):
        print("DEBUG: Entering create_agent")
        agent_graph = (
            StateGraph(State)
            .add_node(self.summarize, "summarize")
            .add_node(self.call_model, "call_model")
            .add_conditional_edges(START, self.should_run)
            .add_edge("summarize", "call_model")
            .add_edge("call_model", END)
            .compile()
        )
        print("DEBUG: Exiting create_agent")
        return agent_graph

    async def chat(self, message: str | None = None) -> Dict[str, str]:
        result = None
        if message:
            self._messages.append({"role": "user", "content": message})
        if self._level == 2:
            graph = await self.create_reflection()
            state = State(messages=self._messages, extract_code=None)
            result = await graph.ainvoke(state)
            return {
                "response": result["messages"][-2].content,
                "summary": self._summary,
            }
        else:
            graph = await self.create_agent()
            state = {
                "messages": self._messages,
            }
            result = await graph.ainvoke(state)
            return {
                "response": result["messages"][-1].content,
                "summary": self._summary,
            }
