import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { BookOpen, Binary, Gauge } from "lucide-react";

const cards = [
  {
    icon: <BookOpen className="w-8 h-8 mb-2 text-blue-500" />, 
    title: "How It Works", 
    description: "Guided Competitive Question", 
    content: "Your website is a Guided Competitive Coding Platform that helps users solve coding problems step by step. It provides a basic implementation instantly, reveals the algorithm after 20 minutes, and offers the full solution after another 20 minutes if needed. The platform also recommends the next problem based on user performance. Designed for competitive programmers and coding bootcamps, it enhances problem-solving skills.",
    bgColor: "bg-blue-600",
    textColor: "text-white"
  },
  {
    icon: <Binary className="w-8 h-8 mb-2 text-green-500" />, 
    title: "Technical Process", 
    description: "Implementation Details", 
    content: "The platform helps users solve coding challenges by providing a basic implementation, revealing the algorithm after 20 minutes, and offering the full solution if needed. It also suggests problems based on user performance, using a Human-in-the-Loop approach, ReAct Agent, and browser-based retrieval to enhance learning.",
    bgColor: "bg-green-700",
    textColor: "text-white"
  },
  {
    icon: <Gauge className="w-8 h-8 mb-2 text-purple-500" />, 
    title: "Key Benefits", 
    description: "Why Use Our System", 
    content: "This website enhances problem-solving skills by providing step-by-step guidance, personalized problem recommendations, and AI-powered assistance. It helps competitive programmers improve efficiently and serves as a valuable resource for coding bootcamps and self-learners.",
    bgColor: "bg-purple-700",
    textColor: "text-white"
  }
];

const CardsExplain = () => {
  return <HoverEffect items={cards} hoverEffect="bg-opacity-50" />;
};

export { CardsExplain };
