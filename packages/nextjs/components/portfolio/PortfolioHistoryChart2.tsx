"use client";

import React, { useEffect, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TokenValue {
  symbol: string;
  usdValue: string;
}

interface PortfolioSnapshot {
  id: number;
  date: string;
  tokenValues: TokenValue[];
}

type TimeframeOption = "1d" | "7d" | "30d" | "all";

export default function PortfolioHistoryChart() {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1d");
  const [limit, setLimit] = useState(24);

  const fetchSnapshots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/paginated-portfolio?limit=${limit}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await response.json();
      console.log(jsonData);

      const portfolioSnapshots: PortfolioSnapshot[] = jsonData.map((item: any) => {
        const allTokens: TokenValue[] = Object.values(item.tokens).flatMap((chain: any) =>
          chain.tokens
            .filter((token: any) => parseFloat(token.valueUSD) > 0.01) // Filtra los tokens con valueUSD > 0.01
            .map((token: any) => ({
              symbol: token.symbol,
              usdValue: token.valueUSD.toString(),
            })),
        );

        return {
          id: item.id,
          date: item.date,
          tokenValues: allTokens,
        };
      });

      setSnapshots(portfolioSnapshots);
      // console.log(portfolioSnapshots)
    } catch (error) {
      console.error("Error fetching snapshots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [limit]);

  const generateColor = (index: number, total: number) => {
    const hue = (index / total) * 360;
    return {
      borderColor: `hsl(${hue}, 70%, 50%)`,
      backgroundColor: `hsl(${hue}, 70%, 80%)`,
    };
  };

  const allTokens = snapshots.flatMap(snapshot => snapshot.tokenValues.filter(token => Number(token.usdValue) > 0.01));

  const uniqueSymbols = [...new Set(allTokens.map(token => token.symbol))];
  const totalTokens = uniqueSymbols.length;

  const datasets = uniqueSymbols.map((symbol, index) => {
    const { borderColor, backgroundColor } = generateColor(index, totalTokens);

    return {
      label: `${symbol}`,
      data: snapshots.map(snapshot => {
        const tokenValue = snapshot.tokenValues.find(t => t.symbol === symbol);
        return Number(tokenValue?.usdValue) > 0.01 ? tokenValue?.usdValue : null; // tokenValue?.usdValue || 0;
      }),
      borderColor,
      backgroundColor,
      // fill: true,
    };
  });

  const data = {
    labels: snapshots.map(snapshot => {
      const date = new Date(Number(snapshot.date) * 1000);
      return date.toLocaleString("en-US", {
        // weekday: "short",
        // year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        // second: "2-digit",
        hour12: false,
      });
    }),
    datasets,
  };

  const options = {
    responsive: true,
    // plugins: {
    //   title: {
    //     display: true,
    //     text: "Historical Portfolio Value over Time",
    //   },
    // },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Value (USD)" },
      },
      x: {
        title: { display: true, text: "Time (earliest → latest)" },
      },
    },
  };

  const handleTimeframeChange = (newTimeframe: TimeframeOption, _limit: number) => {
    setTimeframe(newTimeframe);
    setLimit(_limit);
  };

  // const callQueryPortfol = async () => {
  //   await fetch("/api/query-portfolio");
  // };

  return (
    <div className="w-full p-2 flex flex-col items-center">
      <div className="w-full flex justify-center relative">
        <Line data={data} options={options} />
        {isLoading && (
          <div className="absolute backdrop-blur-sm flex justify-center items-center bg-[#000000]/40 left-0 top-0 w-full h-full">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-6 justify-center mt-3">
        <div className="relative flex">
          <button
            className={`z-10 border-2 border-[#000000] rounded-2xl px-3 py-2 ${timeframe === "1d" ? "bg-[#002FFF] text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#000000]"} rounded max-md:text-sm transition-all duration-700`}
            onClick={() => handleTimeframeChange("1d", 24)}
          >
            1 Day
          </button>
          <div className="absolute w-full h-full border-2 border-[#000000] rounded-2xl -right-1 -bottom-1 z-0" />
        </div>
        <div className="relative flex">
          <button
            className={`z-10 border-2 border-[#000000] rounded-2xl px-3 py-2 ${timeframe === "7d" ? "bg-[#002FFF] text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#000000]"} rounded max-md:text-sm transition-all duration-700`}
            onClick={() => handleTimeframeChange("7d", 168)}
          >
            7 Days
          </button>
          <div className="absolute w-full h-full border-2 border-[#000000] rounded-2xl -right-1 -bottom-1 z-0" />
        </div>
        <div className="relative flex">
          <button
            className={`z-10 border-2 border-[#000000] rounded-2xl px-3 py-2 ${timeframe === "30d" ? "bg-[#002FFF] text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#000000]"} rounded max-md:text-sm transition-all duration-700`}
            onClick={() => handleTimeframeChange("30d", 720)}
          >
            30 Days
          </button>
          <div className="absolute w-full h-full border-2 border-[#000000] rounded-2xl -right-1 -bottom-1 z-0" />
        </div>
        <div className="relative flex">
          <button
            className={`z-10 border-2 border-[#000000] rounded-2xl px-3 py-2 ${timeframe === "all" ? "bg-[#002FFF] text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#000000]"} rounded max-md:text-sm transition-all duration-700`}
            onClick={() => handleTimeframeChange("all", 999)}
          >
            All
          </button>
          <div className="absolute w-full h-full border-2 border-[#000000] rounded-2xl -right-1 -bottom-1 z-0" />
        </div>
      </div>

      {/* <button onClick={callQueryPortfol}>call</button> */}
    </div>
  );
}
