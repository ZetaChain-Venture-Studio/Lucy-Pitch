import React, { useEffect, useState } from "react";

interface LeaderboardProps {
  _refetchScoreFlag: boolean;
}

interface LeaderboardPosition {
  userAddress: string;
  score: number;
}

const Leaderboard = ({ _refetchScoreFlag }: LeaderboardProps) => {
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboardUsers(
        data.data.map((item: any) => ({
          userAddress: item.userAddress,
          score: item.score,
        })),
      ); // Changed here
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
            <span className="font-inter font-[1000] text-3xl">{"// Leaderboard 🏆"}</span>
            <div className="flex gap-2">
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
            </div>
          </div>

          <hr className="w-full border border-[#000000]" />

          <div className="w-full font-bold text-2xl flex flex-col gap-2 py-3">
            <div className="w-full flex justify-between font-inter font-[1000] px-4">
              <span className="">User</span>
              <span className="">Score</span>
            </div>

            <hr className="w-[90%] border border-[#7B7B7B]" />

            <div className="w-full flex flex-col gap-1 px-4">
              {leaderboardUsers.map((entry, index) => (
                <div key={index} className="w-full flex justify-between">
                  <div className="flex gap-2 font-normal text-2xl items-center">
                    <div
                      className={`${index === 0 && "bg-[#FF9500]"} ${index === 1 && "bg-[#FE96E9]"} ${index === 2 && "bg-[#82DC8D]"} ${index > 2 && "bg-[#BFCBFF]"} w-8 h-8 flex items-center justify-center rounded-full font-[1000]`}
                    >
                      {index + 1}
                    </div>
                    {entry.userAddress.slice(0, 15)}...{entry.userAddress.slice(-6)}
                  </div>
                  <span>{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
