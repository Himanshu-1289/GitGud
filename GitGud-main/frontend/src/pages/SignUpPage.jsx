import React from 'react';
import BackgroundImage from '../components/BackgroundImage';
import SignUpForm from './SignUpForm';
import { AuroraBackground } from "@/components/ui/aurora-background";
import Navbar from '@/components/ui/navbar';

const SignUpPage = () => {
  console.log("SignUpPage rendering");
  
  return (
    <div clasName="flex flex-col">
      <Navbar />
      <AuroraBackground>
        {/* Remove the min-h-screen and bg-black since AuroraBackground handles that */}
        <div className="z-10 flex w-full items-center justify-center px-4 py-8">
          <div className="flex h-[85vh] w-full max-w-5xl shadow-xl rounded-xl overflow-hidden relative">
            
            {/* Left side - Background Image */}
            <div className="hidden md:block w-1/2 h-full relative z-10">
              <BackgroundImage />
            </div>
            
            {/* Right side - SignUpForm with z-index */}
            <div className="w-full md:w-1/2 bg-black bg-opacity-70 flex items-center justify-center p-6 z-10">
              <div className="w-[90%] max-w-lg">
                <SignUpForm />
              </div>
            </div>
          </div>
        </div>
      </AuroraBackground>
    </div>
  );
};

export default SignUpPage;