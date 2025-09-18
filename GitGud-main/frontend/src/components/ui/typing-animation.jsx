"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion"; // ✅ Correct import
import { useEffect, useRef, useState } from "react";

export function TypingAnimation({
  children,
  className,
  duration = 100,
  delay = 0,
  as: Component = "div",
  startOnView = false,
  ...props
}) {
  const MotionComponent = motion(Component); // ✅ Fixed motion.create issue
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const elementRef = useRef(null);
  const indexRef = useRef(0); // ✅ Track the current index

  const text = typeof children === "string" ? children : String(children); // ✅ Ensure it's a string

  useEffect(() => {
    if (!startOnView) {
      const startTimeout = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(startTimeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, startOnView]);

  useEffect(() => {
    if (!started) return;

    const typingEffect = setInterval(() => {
      setDisplayedText((prev) => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          return text.substring(0, indexRef.current);
        } else {
          clearInterval(typingEffect);
          return prev;
        }
      });
    }, duration);

    return () => clearInterval(typingEffect);
  }, [text, duration, started]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-4xl font-bold leading-[5rem] tracking-[-0.02em]", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
}
