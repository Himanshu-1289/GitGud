import React, { useEffect, useState } from "react";
import { MessageInput } from "../components/ui/message-input";
import { PromptSuggestions } from "../components/ui/prompt-suggestions";
import { useAxiosPrivate } from "@/axios";
import { useNavigate, useParams } from "react-router-dom";
import { ChatMessage } from "@/components/ui/chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Home, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-black text-white shadow-md border-b-1">
      <Link to="/" className="text-2xl title">
        GitGud
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="text-foreground bg-gray-900 hover:text-gray-700 hover:bg-white">
            <span>Menu</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-100 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-56 p-2 rounded-lg shadow-xl
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                     data-[side=bottom]:slide-in-from-top-2"
        >
          <DropdownMenuLabel className="px-2 py-1 text-xs text-gray-300">
            Navigate
          </DropdownMenuLabel>

          <DropdownMenuItem
            asChild
            className="flex text-gray-50 items-center px-2 py-2 rounded-sm hover:bg-white hover:text-gray-700"
          >
            <Link to="/home" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 h-px bg-gray-800" />

          <DropdownMenuLabel className="px-2 py-1 text-xs text-gray-300">
            Account
          </DropdownMenuLabel>

          <DropdownMenuItem
            onSelect={handleLogout}
            className="flex items-center text-gray-50  px-2 py-2 rounded-sm hover:bg-gray-100 hover:text-gray-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
            <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // To store chat messages
  const axiosPrivateInstance = useAxiosPrivate();
  const [isGenerating, setGenerating] = useState(false);
  const { id } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      message: message,
    };

    // 1. Immediately add the user message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setMessage(""); // Clear input
    setGenerating(true);

    try {
      // 2. Send to API and wait for bot response
      const response = await axiosPrivateInstance.post(
        `/chat_message/?chat_id=${id}`,
        {
          message: userMessage.message,
        }
      );

      const botMessage = {
        role: "assistant",
        message: response?.data?.message,
      };

      // 3. Add the bot's reply
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const botMessage = {
        role: "assistant",
        message: "Error occured, try again later!",
      };
      setMessages((prev) => [...prev, botMessage]);
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // This function will add a suggestion to the message input
  const appendMessage = (newMessage) => {
    setMessage(newMessage.content);
  };

  const handleTranscription = async (audioBlob) => {
    // Example placeholder: Convert audioBlob to text
    const transcribedText = "Sample transcribed text";
    return transcribedText;
  };

  // Example suggestions
  const promptSuggestions = [
    "Are there any other alternative methods?",
    "What is the time and space comlexity",
    "Can you help me solve this question ",
  ];
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messages = await axiosPrivateInstance.get(
          `/messages/?chat_id=${id}`
        );
        setMessages(messages.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, []);

  return (
    <div className="flex flex-col h-screen max-w mx-auto">
      <Navbar />
      {/* Chat Container */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Empty State with Centered Suggestions */}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-3xl">
              <PromptSuggestions
                label="How can I help you today?"
                append={appendMessage}
                suggestions={promptSuggestions}
              />
            </div>
          </div>
        ) : (
          /* Chat Messages Display Area */
          <div className="flex-1 overflow-y-auto py-4 px-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <ChatMessage
                  role={`${msg.role}`}
                  content={`${msg.message}`}
                ></ChatMessage>
              </div>
            ))}
            {isGenerating && <TypingIndicator />}
          </div>
        )}

        {/* Message Input Area - Fixed at bottom */}
        <div className="border-t bg-black p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <MessageInput
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              isGenerating={isGenerating}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
