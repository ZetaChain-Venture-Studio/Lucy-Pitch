import React, { useEffect, useState } from "react";

interface WinningPromptsProps {
  _refetchScoreFlag: boolean;
}

interface WinningPrompt {
  user: string;
  score: number;
  prompt: string;
}

const WinningPrompts = ({ _refetchScoreFlag }: WinningPromptsProps) => {
  const [winningPrompts, setWinningPrompts] = useState<WinningPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getWinningPrompts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/paginated-winning-prompts?limit=10");
      const data = await res.json();
      setWinningPrompts(
        data.data.map((item: any) => ({
          user: item.userAddress,
          score: item.score,
          prompt: item.pitch,
        })),
      );
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getWinningPrompts();
  }, [_refetchScoreFlag]);

  return (
    <div
      className="relative border rounded-lg shadow-lg p-6 bg-white max-w-md flex flex-col justify-center items-center"
      style={{ width: "100%", minWidth: "320px", minHeight: "200px" }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col w-full items-center gap-6">
          <h2 className="text-2xl font-bold text-amber-500">Winning Prompts 🧠</h2>

          <div className="w-full text-lg flex flex-col gap-4 max-h-[600px] overflow-y-scroll">
            {winningPrompts.map((entry, index) => (
              <div key={index} className="w-full text-lg flex flex-col gap-2">
                <div className="w-full flex justify-between text-base font-bold">
                  <span>
                    User {entry.user.slice(0, 3)}...{entry.user.slice(-3)}
                  </span>
                  <span className="text-emerald-500">user score: {entry.score}</span>
                </div>
                <div className="w-full flex justify-between text-base bg-emerald-200 rounded-lg p-3">
                  {entry.prompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WinningPrompts;
