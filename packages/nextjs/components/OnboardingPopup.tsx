"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lucy from "../public/assets/lucy-home.png";

type OnboardingPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

function OnboardingPopup({ isOpen, onClose }: OnboardingPopupProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleAccept = () => {
    if (acceptedTerms) {
      localStorage.setItem("onboardingAccepted", "true");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
      <div className="relative bg-white rounded-lg shadow-lg w-[450px] h-[450px] border-2 border-[#000000] font-inter">
        <div className="px-4 py-2 border-b border-[#000000]">
          <h2 className="text-lg font-[1000]">{"// Pitch Lucy"}</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <span className="text-3xl font-[1000]">Welcome to Pitch Lucy !</span>

          <div className="flex gap-2">
            <div className="min-w-2 w-2 min-h-2 h-2 rounded-full bg-[#697EF5] mt-2" />
            <span>Select a token and submit investment ideas to our AI fund manager Lucy.</span>
          </div>

          <div className="flex gap-2">
            <div className="min-w-2 w-2 min-h-2 h-2 rounded-full bg-[#697EF5] mt-2" />
            <span>Earn USDC for successful pitches and grow your score.</span>
          </div>

          <div className="flex gap-2">
            <div className="min-w-2 w-2 min-h-2 h-2 rounded-full bg-[#697EF5] mt-2" />
            <span>Watch the portfolio go to the moon.</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-4">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
            className="w-6 h-6 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm">
            I accept the{" "}
            <Link href="/terms" className="text-blue-500 hover:underline" target="_blank">
              Terms and Conditions
            </Link>
          </label>
        </div>
        <div className="flex justify-center p-4">
          <div className="w-[220px] relative flex">
            <button
              onClick={handleAccept}
              disabled={!acceptedTerms}
              className={`px-6 py-2 w-full text-white ${acceptedTerms ? "bg-[#1100FF]" : "bg-gray-300 cursor-not-allowed"} border-2 border-[#000000] rounded-box hover:bg-gray-800 flex z-20 justify-center font-inter font-[1000] text-xl`}
            >
              Start Playing
            </button>
            <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] bg-[#FFFFFF] rounded-box z-10" />
          </div>
        </div>
        <Image
          src={Lucy}
          alt="AI Capital"
          className="absolute rounded w-[250px] -right-14 bottom-0 transform scale-x-[-1]"
        />
      </div>
    </div>
  );
}

export default OnboardingPopup;
