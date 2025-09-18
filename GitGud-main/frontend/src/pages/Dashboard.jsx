import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { CardsExplain } from "@/components/cardsExplain";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar"; // Import the Navbar component
import FAQ from "@/components/ui/faq"; // Import the FAQ component

function Dashboard() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const cardsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative flex flex-col">

      {/* Hero Section with 3D Card */}
      <AuroraBackground className="h-auto" showRadialGradient={false}>
        <div className="flex flex-col">
          <Navbar />
          <div className="mt-20 max-w-7xl mx-auto w-full px-4 mb-20">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* Typing Animation on the left */}
              <div className="w-full md:w-1/3">
                <TypingAnimation className="text-white text-3xl md:text-5xl font-bold">
                  A Guided Competitive Coding Platform
                </TypingAnimation>
              </div>

              {/* 3D Card Container */}
              <div className="w-full md:w-2/3">
                <CardContainer className="w-full">
                  <CardBody className="bg-black/80 relative group/card dark:bg-black/90 dark:border-white/[0.2] border-black/[0.1] w-full rounded-xl p-6 border">
                    {/* Card Image */}
                    <CardItem translateZ={100} className="w-full">
                      <img
                        src="/images/Photo2.jpg"
                        className="h-72 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                        alt="dashboard background"
                      />
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </div>
            </div>
          </div>
          <div ref={cardsRef} className="max-w-7xl mx-auto w-full px-4">
            <h2 className="text-white text-4xl font-bold text-center mb-12">
              What We Offer
            </h2>
            <CardsExplain />
          </div>
          {/* FAQ Section */}
          <FAQ />
        </div>
      </AuroraBackground>

      <Footer />

      {/* Back to top button */}
      <button
        className={`fixed bottom-8 right-8 bg-white/10 backdrop-blur-sm p-3 rounded-full shadow-lg transition-opacity ${
          scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
}

export default Dashboard;
