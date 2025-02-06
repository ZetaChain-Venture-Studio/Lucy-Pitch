import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface MyScoreProps {
  _refetchScoreFlag: boolean;
}

const MyScore = ({ _refetchScoreFlag }: MyScoreProps) => {
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();

  useEffect(() => {
    const fetchTokens = async () => {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userAddress: address }),
      });

      const data = await response.json();

      if (response.ok) setScore(data.score);
      setIsLoading(false);
    };

    address && fetchTokens();
  }, [address, _refetchScoreFlag]);

  return (
    // <div
    //   className="relative border w-full min-h-[200px] rounded-lg bg-white text-inter border-2 border-[#000000] flex flex-col justify-center items-center"
    // >
    //   {isLoading ? (
    //     <div className="flex justify-center items-center h-full w-full">
    //       <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    //     </div>
    //   ) : (
    //     <div className="flex flex-col gap-2 justify-between items-start w-full py-2">
    //       <div className="w-full flex justify-between items-center px-4">
    //         <span className="font-inter font-[1000] text-3xl">// My Score 🍀</span>
    //         <div className="flex gap-2">
    //           <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
    //           <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
    //           <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
    //         </div>
    //       </div>

    //       <hr className="w-full border border-[#000000]" />

    //       <p className="text-3xl font-bold text-gray-900 px-4">{score}</p>
    //       <p className="text-base px-4 text-inter">
    //         A score calculated based on the number of Investment Pitch submissions sent to Lucy. Winning pitches are
    //         awarded a higher score.
    //       </p>
    //     </div>
    //   )}
    // </div>

    <div className="w-full h-[170px] bg-[url(/assets/bg-pitch.png)] bg-cover bg-top bg-no-repeat flex gap-8 items-center justify-end">
      <div className="relative w-[180px] h-[120px] flex">
        <div className="w-full h-full border-2 border-[#000000] bg-[#FFFFFF] rounded-box font-inter font-[1000] z-10 flex flex-col items-center justify-evenly px-3">
          <div className="w-full flex justify-center items-center gap-2">
            <span className="font-inter">Current Round</span>
            <div className="border border-[#000000] w-4 h-4 rounded-full font-bold text-xs text-center">i</div>
          </div>
          <hr className="w-[90%] border border-[#7B7B7B]" />
          <span className="text-7xl">1 / 4</span>
        </div>
        <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] bg-[#FFFFFF] rounded-box z-0" />
      </div>

      <div className="relative w-[180px] h-[120px] flex">
        <div className="w-full h-full border-2 border-[#000000] bg-[#FFFFFF] rounded-box font-inter font-[1000] z-10 flex flex-col items-center justify-center px-3">
          {!address ? (
            <span className="text-6xl text-[#1100FF]">0</span>
          ) : isLoading ? (
            <div className="w-6 h-6 my-3 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <span className="text-6xl text-[#1100FF]">{score}</span>
          )}
          <span className="text-xl flex items-center gap-2">
            My SCORE <div className="border border-[#000000] w-4 h-4 rounded-full font-bold text-xs text-center">i</div>
          </span>
        </div>
        <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] bg-[#FFFFFF] rounded-box z-0" />
      </div>
    </div>
  );
};

export default MyScore;
