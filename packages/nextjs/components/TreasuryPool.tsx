import React, { useEffect, useState } from "react";
import PortfolioHistoryChart from "./portfolio/PortfolioHistoryChart2";
import { Token } from "~~/types/token";

interface TrasuryProps {
  _refetchScoreFlag: boolean;
}

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

const TreasuryCard = ({ _refetchScoreFlag }: TrasuryProps) => {
  const [totalValue, setTotalValue] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<"breakdown" | "trends">("breakdown");

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // const res = await fetch("/api/portfolio");
        const res = await fetch("/api/treasury");
        if (!res.ok) {
          console.error("Failed to fetch tokens from /api/portfolio:", res.statusText);
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
  }, [_refetchScoreFlag]);

  // Filter tokens with USD value >= 1
  const filteredTokens = tokens.filter(token => token.valueUSD && token.valueUSD >= 0);
  const sortedTokens = [...filteredTokens].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
  console.log(sortedTokens);

  return (
    <div className="relative w-full min-h-[450px] border-2 border-[#000000] rounded-lg shadow-lg bg-white flex flex-col items-center">
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <div className="w-full flex justify-between items-center px-4 py-3">
            <span className="font-inter font-[1000] text-3xl">{"// Treasury Pool 💰"}</span>
            <div className="flex gap-2">
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
            </div>
          </div>

          <hr className="w-full border border-[#000000]" />

          <div className="w-full px-4 py-6 flex flex-col gap-4">
            {/* SECTION SELECTOR */}
            <div className="flex gap-2 w-full h-[50px] border-2 border-[#000000] rounded-full text-3xl font-[1000] font-inter relative">
              <button
                onClick={() => setSection("breakdown")}
                className={`rounded-full px-4 h-full absolute left-0 transition-all duration-700 ${section === "breakdown" ? "bg-[#002FFF] text-[#FFFFFF] border-2 border-[#000000] bottom-2" : "text-[#000000] bottom-0"}`}
              >
                Portfolio Breakdown
              </button>
              <button
                onClick={() => setSection("trends")}
                className={`rounded-full px-4 h-full absolute right-0 transition-all duration-700 ${section === "trends" ? "bg-[#002FFF] text-[#FFFFFF] border-2 border-[#000000] bottom-2" : "text-[#000000] bottom-0"}`}
              >
                Trends
              </button>
            </div>

            {section === "breakdown" ? (
              <>
                <div className="w-full flex justify-between">
                  <span className="w-1/2 text-[#1100FF] font-inter font-bold text-5xl">
                    $ {totalValue.toLocaleString()}
                  </span>
                  <span className="w-1/2 text-end pr-2">Total amount in the treasury for investments</span>
                </div>

                <div className="w-full h-[80px] flex rounded-lg">
                  {sortedTokens.map((token, index) => {
                    const percentage = totalValue > 0 ? ((token.valueUSD ?? 0) / totalValue) * 100 : 0;

                    return (
                      <div
                        key={index}
                        className={`${index === 0 && "rounded-l-lg"} ${index === sortedTokens.length - 1 && "rounded-r-lg"} h-full flex flex-col justify-center items-center ${colors[index].blackText ? "text-[#000000]" : "text-[#FFFFFF]"} font-inter uppercase font-[1000] min-w-[10%]`}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[index].color,
                        }}
                      >
                        <span>{percentage.toFixed(0)}%</span>
                        <span>{token.symbol}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full font-inter text-sm">
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
                        <tr key={index} className="text-center">
                          <td className="px-4 py-2">
                            <div className={`w-9 h-6`} style={{ backgroundColor: colors[index].color }}></div>
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
                </div>
              </>
            ) : (
              <>
                <span className="w-full text-end">Explore the performance of the hedge fund</span>
                <div>
                  <PortfolioHistoryChart />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryCard;
