import React from 'react';

const BackgroundImage = () => {
  return (
    <div className="relative w-full h-full">
      {/* Image with proper sizing */}
      <img
        src="/images/Photo1.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay with Welcome text */}
      <div className="absolute inset-0 bg-green bg-opacity-50 flex justify-center items-center">
        
        
      </div>
    </div>
  );
};

export default BackgroundImage;
