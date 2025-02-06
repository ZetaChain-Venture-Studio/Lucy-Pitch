import React, { useEffect, useState } from "react";
import { BlockieAvatar } from "../scaffold-eth";

interface LeaderboardProps {
  _refetchScoreFlag: boolean;
}

interface WinnerPosition {
  userAddress: string;
  prize: number;
}

const Winners = ({ _refetchScoreFlag }: LeaderboardProps) => {
  const [winnerUsers, setWinnerUsers] = useState<WinnerPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setWinnerUsers(
        data.data.map((item: any) => ({
          userAddress: item.userAddress,
          prize: item.prize,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLeaderboard();
  }, [_refetchScoreFlag]);

  return (
    <div className="w-full min-h-[300px] border-2 border-[#000000] relative border rounded-lg shadow-lg bg-white flex flex-col justify-center items-center">
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col w-full items-center">
          <div className="w-full flex justify-between items-center px-4 py-3">
            <span className="font-inter font-[1000] text-3xl">{"// Winners 👑"}</span>
            <div className="flex gap-2">
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
            </div>
          </div>

          <hr className="w-full border border-[#000000]" />

          <div className="w-full font-bold text-2xl flex flex-col gap-2 py-3">
            <div className="w-full flex justify-between font-inter font-[1000] px-4">
              <span className="">Winners</span>
              <span className="">Prize</span>
            </div>

            <hr className="w-[90%] border border-[#7B7B7B]" />

            <div className="w-full flex flex-col gap-1 px-4">
              {winnerUsers.slice(0, 3).map((entry, index) => (
                <div key={index} className="w-full flex justify-between">
                  <div className="flex gap-2 font-normal text-2xl items-center">
                    <BlockieAvatar address={entry.userAddress} size={30} />
                    {entry.userAddress.slice(0, 15)}...{entry.userAddress.slice(-6)}
                  </div>
                  <span>$ {entry.prize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Winners;
