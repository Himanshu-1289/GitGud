import React, { createContext, useContext, useRef, useState } from "react";

// Context for 3D Card effect
const MouseEnterContext = createContext(null);

// Card Container Component
export const CardContainer = ({ children, className, ...props }) => {
  const containerRef = useRef(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    // Reduced rotation factor from 25 to 50 (smaller value = more intense)
    const rotationFactor = 50;
    const x = (e.clientX - left - width / 2) / rotationFactor;
    const y = (e.clientY - top - height / 2) / rotationFactor;
    
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };
  
  const handleMouseEnter = () => {
    setIsMouseEntered(true);
    if (!containerRef.current) return;
    containerRef.current.style.transition = "transform 0.3s ease-out";
  };
  
  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transition = "transform 0.5s ease-out"; // Slower return transition
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };
  
  return (
    <MouseEnterContext.Provider value={isMouseEntered}>
      <div
        ref={containerRef}
        className={`flex items-center justify-center ${className}`}
        style={{ perspective: "1500px" }} // Increased perspective for subtler effect
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    </MouseEnterContext.Provider>
  );
};

// Card Body Component
export const CardBody = ({ children, className, ...props }) => {
  return (
    <div
      className={`w-full relative ${className}`}
      style={{ transformStyle: "preserve-3d" }}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Item Component
export const CardItem = ({
  as: Component = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  ...props 
}) => {
  const isMouseEntered = useContext(MouseEnterContext);
  
  // Reduce the translation values by applying a damping factor
  const dampingFactor = 0.5; // Lower = less movement
  const dampedX = translateX * dampingFactor;
  const dampedY = translateY * dampingFactor;
  const dampedZ = translateZ * dampingFactor;
  
  return (
    <Component
      className={`transition duration-300 ease-linear ${className}`} // Slower transition
      style={{
        transform: isMouseEntered
          ? `translateX(${dampedX}px) translateY(${dampedY}px) translateZ(${dampedZ}px)`
          : "translateZ(0px)",
        transformStyle: "preserve-3d",
      }}
      {...props}
    >
      {children}
    </Component>
  );
};