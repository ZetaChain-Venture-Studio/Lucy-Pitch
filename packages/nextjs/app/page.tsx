"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Lucy from "../public/assets/lucy-home.png";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/pitch");
  };

  return (
    <main className="min-h-screen bg-[url(/assets/bg-home.jpg)] bg-center bg-cover flex flex-col justify-evenly">
      <div className="w-full flex justify-center">
        <div className="w-[1100px] flex justify-end">
          <div className="relative flex">
            <button
              onClick={handleGetStarted}
              className="font-inter bg-[#000000] text-[#FFFFFF] font-[1000] text-2xl px-3 py-2 rounded-lg z-10"
            >
              GET STARTED
            </button>
            <div className="absolute w-full h-full -bottom-3 -right-3 border-2 border-[#000000] bg-[#FFFFFF] rounded-lg z-0 bg-[url(/assets/bg-star2.png)] bg-center bg-repeat bg-[2px_2px]" />
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center">
        <div className="w-[1100px] relative flex">
          <div className="w-full border-2 border-[#000000] bg-[#FFFFFF] rounded-t-box z-10">
            <div className="w-full flex justify-between items-center px-8 py-3">
              <span className="font-inter font-[1000] text-3xl">{"// AI CAPITAL"}</span>
              <div className="flex gap-2">
                <div className="border-2 border-[#000000] w-5 h-5 rounded-full" />
                <div className="border-2 border-[#000000] w-5 h-5 rounded-full" />
                <div className="border-2 border-[#000000] w-5 h-5 rounded-full" />
              </div>
            </div>

            <hr className="w-full border border-[#000000]" />

            <div className="w-full p-8 flex flex-col gap-6 relative">
              <span className="font-inter font-[1000] text-9xl">AI CAPITAL</span>
              <span className="font-inter font-[1000] text-4xl w-1/2">Convince Lucy to Invest in Your Token</span>
              <div className="flex gap-4 z-10 backdrop-blur-sm">
                <span className="w-1/2 bg-[#D2DAFFCC]/80 px-5 py-2 text-[#0400FF] rounded-lg font-jura font-medium">
                  Play the game by pitching your favorite token to our advanced AI and see if you can convince it to
                  invest.
                </span>
                <span className="w-1/2 bg-[#D2DAFFCC]/80 px-5 py-2 text-[#0400FF] rounded-lg font-jura font-medium">
                  Challenge yourself in this interactive game where AI meets human ingenuity.
                </span>
              </div>
              <Image src={Lucy} alt="AI Capital" className="absolute rounded w-1/3 -right-14 bottom-0" />
            </div>
          </div>
          <div className="absolute w-full h-full -bottom-5 -right-5 border-2 border-[#000000] bg-[#FFFFFF] rounded-t-box z-0 bg-[url(/assets/bg-star2.png)] bg-center bg-repeat bg-[2px_2px]" />
        </div>
      </div>
    </main>
  );
}
