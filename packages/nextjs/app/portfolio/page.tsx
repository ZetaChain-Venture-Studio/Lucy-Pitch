"use client";

import { useEffect, useState } from "react";
import PortfolioHistoryChart from "../../components/portfolio/PortfolioHistoryChart2";
import { ArcElement, Chart as ChartJS, ChartOptions, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { Token } from "~~/types/token";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PortfolioPage() {
  const [totalValue, setTotalValue] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/treasury");
        if (!res.ok) {
          console.error("Failed to fetch tokens from /api/treasury:", res.statusText);
          return;
        }

        const data = await res.json();
        // console.log(data);
        const allTokens = Object.values(data.tokens).flatMap((chain: any) => chain.tokens || []);

        const groupedTokens = allTokens.reduce((acc: Record<string, any>, token) => {
          if (!acc[token.symbol]) {
            acc[token.symbol] = { ...token };
          } else {
            acc[token.symbol].valueUSD += token.valueUSD || 0;
            acc[token.symbol].balanceFormatted += token.balanceFormatted || 0;
          }
          return acc;
        }, {});

        const uniqueTokens = Object.values(groupedTokens);
        const totalUsdValue = uniqueTokens.reduce((sum, token) => sum + (token.valueUSD || 0), 0);
        setTokens(uniqueTokens);
        setTotalValue(totalUsdValue);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  // Filter out tokens with USD value less than 1
  // const filteredTokens = tokens.filter(token => token.usd_value >= 1);

  const generateColor = (index: number, total: number) => {
    const hue = (index / total) * 360;
    return {
      backgroundColor: `hsla(${hue}, 70%, 50%, 1)`,
      borderColor: `hsla(${hue}, 70%, 40%, 1)`,
      hoverColor: `hsla(${hue}, 70%, 50%, 0.8)`,
    };
  };

  const colors = [
    { color: "#FE8C00", blackText: false },
    { color: "#FFEB00", blackText: true },
    { color: "#3CFF84", blackText: false },
    { color: "#FFCDE5", blackText: false },
    { color: "#2107E7", blackText: false },
    { color: "#CD68FF", blackText: false },
    { color: "#FE8C00", blackText: false },
    { color: "#FFEB00", blackText: true },
    { color: "#3CFF84", blackText: false },
    { color: "#FFCDE5", blackText: false },
    { color: "#2107E7", blackText: false },
    { color: "#CD68FF", blackText: false },
    { color: "#FE8C00", blackText: false },
    { color: "#FFEB00", blackText: true },
    { color: "#3CFF84", blackText: false },
    { color: "#FFCDE5", blackText: false },
    { color: "#2107E7", blackText: false },
    { color: "#CD68FF", blackText: false },
  ];

  // Filter tokens with USD value >= 1
  const filteredTokens = tokens.filter(token => token.valueUSD && token.valueUSD >= 0);
  const sortedTokens = [...filteredTokens].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
  // console.log(sortedTokens);

  const pieData = {
    labels: tokens.map(token => token.symbol),
    datasets: [
      {
        label: "Asset Allocation (USD)",
        data: sortedTokens.map(token => token.valueUSD?.toFixed(2)),
        backgroundColor: sortedTokens.map((_, index) => colors[index].color),
        borderColor: "#000000",
        borderWidth: 4,
        // hoverBackgroundColor: tokens.map((_, index) => generateColor(index, tokens.length).hoverColor),
        hoverOffset: 8,
      },
    ],
  };

  const pieOptions: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        display: false,
      },
    },
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 p-8 font-inter flex justify-center font-[1000]">
      <div className="w-full max-w-[80vw] flex flex-col gap-4 items-start">
        <span className="text-7xl text-center">AI Agent Portfolio</span>

        <div className="w-full flex justify-between items-center rounded-t-3xl border-2 border-[#000000] bg-[#FFFFFF] p-5">
          <span className="text-3xl">{"// Hedge Fund Portfolio"}</span>
          <div className="flex gap-2">
            <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
            <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
            <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
          </div>

          <div className="w-full flex justify-between items-center h-[500px]">
            <div className="h-full flex flex-col justify-between">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[#1100FF] font-bold text-7xl">
                    $ {totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-2xl">Total Value Locked (TVL): </span>
                </div>
                <span className="font-medium">Total amount in the treasury for investments</span>
              </div>

              <span className="text-2xl">Asset Allocation</span>
            </div>

            <div className="w-80 h-80 mt-4">{tokens.length > 0 && <Pie data={pieData} options={pieOptions} />}</div>

            <div className="w-[40%] mt-4">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading tokens...</p>
              ) : tokens.length === 0 ? (
                <p className="text-center text-gray-500">No tokens found.</p>
              ) : (
                <table className="min-w-full font-inter text-xl">
                  <thead>
                    <tr className="">
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2 font-[1000]">Amount</th>
                      <th className="px-4 py-2 font-[1000]">Currency</th>
                      <th className="px-4 py-2 font-[1000]">Percentage</th>
                      <th className="px-4 py-2 font-[1000]">USD Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTokens.map((token, index) => (
                      <tr key={index} className="text-center font-medium">
                        <td className="px-4 py-2">
                          <div className={`w-16 h-9`} style={{ backgroundColor: colors[index].color }}></div>
                        </td>
                        <td className="px-4 py-2 border-t border-r">{token.balanceFormatted}</td>
                        <td className="px-4 py-2 border-t border-r">{token.symbol}</td>
                        <td className="px-4 py-2 border-t border-r">
                          {(((token.valueUSD ?? 0) / totalValue) * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2 border-t">${token.valueUSD?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="w-full flex justify-between items-center rounded-t-3xl border-2 border-[#000000] bg-[#FFFFFF] p-5 mt-20">
            <span className="text-3xl">{"// Historical Portfolio Value over Time"}</span>
            <div className="flex gap-2">
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
            </div>
          </div>

          <div className="w-full flex my-6">
            <PortfolioHistoryChart />
          </div>
        </div>
      </div>
    </div>
  );
}
