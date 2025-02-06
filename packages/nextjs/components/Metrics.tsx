import React, { useEffect, useState } from "react";

interface MetricsProps {
  _refetchScoreFlag: boolean;
}

const Metrics = ({ _refetchScoreFlag }: MetricsProps) => {
  const [metricsData, setMetricsData] = useState({
    totalUsers: 0,
    totalPrompts: 0,
    totalWinners: 0,
    avgTriesPerUser: 0,
    promptFeesPaid: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const getMetrics = async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setMetricsData({
        totalUsers: data.totalUsers,
        totalPrompts: data.totalPrompts,
        totalWinners: data.totalWinners,
        avgTriesPerUser: data.avgTriesPerUser,
        // TODO: take from the backend
        promptFeesPaid: 4.25,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getMetrics();
  }, [_refetchScoreFlag]);

  return (
    <div className="w-full min-h-[300px] relative border-2 border-[#000000] rounded-lg py-6 bg-white flex flex-col justify-center items-center">
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full text-2xl font-inter font-[1000] text-[#000000]">
          <div className="w-full flex justify-between items-center px-6">
            <h2 className="">Total users</h2>
            <div className="flex w-1/4 justify-between">
              <p className="">🧑🏻‍💻</p>
              <p className="">{metricsData.totalUsers}</p>
            </div>
          </div>
          <hr className="w-full border border-[#7B7B7B]" />
          <div className="w-full flex justify-between items-center px-6">
            <h2 className="">Total prompts</h2>
            <div className="flex w-1/4 justify-between">
              <p className="">📜</p>
              <p className="">{metricsData.totalPrompts}</p>
            </div>
          </div>
          <hr className="w-full border border-[#7B7B7B]" />
          <div className="w-full flex justify-between items-center px-6">
            <h2 className="">Total winners</h2>
            <div className="flex w-1/4 justify-between">
              <p className="">👑</p>
              <p className="">{metricsData.totalWinners}</p>
            </div>
          </div>
          <hr className="w-full border border-[#7B7B7B]" />
          <div className="w-full flex justify-between items-center px-6">
            <h2 className="">Average tries per user</h2>
            <div className="flex w-1/4 justify-between">
              <p className="">🎣</p>
              <p className="">{metricsData.avgTriesPerUser}</p>
            </div>
          </div>
          <hr className="w-full border border-[#7B7B7B]" />
          <div className="w-full flex justify-between items-center px-6">
            <h2 className="">Prompt fees paid</h2>
            <div className="flex w-1/4 justify-between">
              <p className="">💸</p>
              <p className="">$ {metricsData.promptFeesPaid}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;
