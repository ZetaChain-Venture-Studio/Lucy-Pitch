import React, { useEffect, useState } from "react";
import Image from "next/image";
import CoinsSVG from "../public/assets/coins.png";

interface BountyCardProps {
  _refetchScoreFlag: boolean;
}

const BountyCard: React.FC<BountyCardProps> = ({ _refetchScoreFlag }) => {
  const [walletAmount, setWalletAmount] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWalletAmount = async () => {
      try {
        const res = await fetch("/api/wallet");
        if (!res.ok) {
          console.error("Failed to fetch wallet amount:", res.statusText);
          return;
        }

        const data = await res.json();
        setWalletAmount(Number(data.bounty).toFixed(2));
      } catch (error) {
        console.error("Error fetching wallet amount:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletAmount();
  }, [_refetchScoreFlag]);

  return (
    <div className="relative w-full min-h-[300px] border-2 border-[#000000] rounded-lg p-6 bg-[#71FF6A] flex flex-col justify-center items-center font-inter">
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Image alt="coins" src={CoinsSVG} className="absolute -right-7 top-2 w-14" />
          <span className="text-4xl font-[1000]">Bounty To Win ! 🤑</span>
          <span className="text-lg font-[1000] italic">Convince Lucy to buy a token and earn the finders fee!</span>
          <div className="w-full h-[100px] relative">
            <div className="absolute w-[115%] h-full right-0">
              <div className="relative flex w-full">
                <span className="w-full h-full border-2 border-[#000000] bg-[#FFFFFF] text-[#1100FF] rounded-box font-jersey text-center text-8xl z-10">
                  ${walletAmount.toLocaleString()} <span className="text-5xl">USD</span>
                </span>
                <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] bg-[#FFFFFF] rounded-box z-0" />
              </div>
            </div>
          </div>
          <p className="text-base mt-2">
            The pool grows with every prompt submission. Winners automatically get the transaction deposited on their
            wallet on Zetachain network.
          </p>
        </div>
      )}
    </div>
  );
};

export default BountyCard;
