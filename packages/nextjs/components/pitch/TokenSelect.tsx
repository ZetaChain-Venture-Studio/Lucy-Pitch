"use client";

import React, { useEffect, useState } from "react";
import { chains } from "~~/lib/constants";
import { ChainData } from "~~/types/chainData";
import { Token } from "~~/types/token";

const pseudoToken: Token = {
  address: "",
  symbol: "CUSTOM",
  decimals: 18,
};

interface ChainTokenSelectorProps {
  onSelect: (chain: ChainData | undefined, token: Token | undefined) => void;
}

export default function ChainTokenSelector({ onSelect }: ChainTokenSelectorProps) {
  const [selectedChain, setSelectedChain] = useState<ChainData | undefined>(undefined);
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(undefined);

  // const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string>("");
  const [customInputAddress, setCustomInputAddress] = useState<string>("");
  const [tokenName, setTokenName] = useState<string>("");

  /**
   * Helper to call onSelect with the *current* selected chain and token
   */
  const triggerOnSelect = (chain: ChainData | undefined, tokenSymbol: string, customAddr: string) => {
    if (!chain) {
      // No chain chosen yet => onSelect(null, null)
      onSelect(undefined, undefined);
      return;
    }

    // If user selected "CUSTOM" but hasn't typed an address yet => pass null
    if (tokenSymbol === "CUSTOM") {
      if (!customAddr) {
        // No custom address => token is null
        onSelect(chain, undefined);
        return;
      }

      // If custom address is typed, build a pseudo token
      const pseudoToken: Token = {
        address: customAddr,
        symbol: "CUSTOM",
        decimals: 18,
      };
      onSelect(chain, pseudoToken);
      return;
    }

    // If tokenSymbol is empty => no token selected yet
    if (!tokenSymbol) {
      onSelect(chain, undefined);
      return;
    }

    // Otherwise find the token from chainTokens
    const foundToken = chain.tokens.find(t => t.symbol === tokenSymbol);
    if (!foundToken) {
      onSelect(chain, undefined);
      return;
    }

    onSelect(chain, foundToken);
  };

  /**
   * When user changes chain
   */
  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chain = chains.find(c => c.chainId === Number(e.target.value));
    setSelectedToken(undefined);
    setSelectedChain(chain);
  };

  /**
   * When user changes token selection
   */
  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const symbol = e.target.value;
    if (symbol === "CUSTOM") {
      // setCustomAddress("");
      setTokenName("");
      setSelectedToken(pseudoToken);
      return;
    }

    const token = selectedChain?.tokens.find(c => c.symbol === e.target.value);
    setSelectedToken(token);

    // triggerOnSelect(currentChain!, symbol, symbol === "CUSTOM" ? "" : customAddress);
  };

  /**
   * When user types a custom address
   */
  const handleCustomAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const addr = e.target.value;
    setCustomInputAddress(addr);
  };

  async function fetchTokenName(tokenAddress: string, chainId: number): Promise<string> {
    try {
      const res = await fetch("/api/get-token-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: tokenAddress, chainId: chainId }),
      });

      if (!res.ok) {
        console.error("Error calling /api/get-token-name:", await res.text());
        return "";
      }

      const data = await res.json();
      return data.name || "";
    } catch (error) {
      console.error("Error fetching token name:", error);
      return "";
    }
  }

  /**
   * Side-effect: whenever "CUSTOM" + a non-empty address is entered, fetch the token name
   */
  // useEffect(() => {
  //   let isCancelled = false;

  //   async function run() {
  //     if (selectedTokenSymbol === "CUSTOM" && customAddress) {
  //       const name = await fetchTokenName(customAddress, selectedChainId as number);
  //       if (!isCancelled) {
  //         setTokenName(name);
  //       }
  //     } else {
  //       // Clear if not custom or empty address
  //       setTokenName("");
  //     }
  //   }

  //   run();
  //   return () => {
  //     isCancelled = true;
  //   };
  // }, [selectedTokenSymbol, customAddress, selectedChainId]);

  /**
   * Side-effect: trigger onSelect whenever customAddress changes
   * (so the parent knows the new "pseudo token")
   */
  // useEffect(() => {
  //   if (selectedTokenSymbol === "CUSTOM") {
  //     triggerOnSelect(currentChain!, "CUSTOM", customAddress);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [customAddress]);

  useEffect(() => {
    if (selectedToken?.symbol === "CUSTOM") {
      const isValid = /^0x[a-fA-F0-9]{40}$/.test(customInputAddress);

      setSelectedToken(prevToken => {
        if (!prevToken) return undefined;
        return {
          ...prevToken,
          address: isValid ? customInputAddress : "",
        };
      });
    }
    onSelect(selectedChain, selectedToken);
  }, [customInputAddress, selectedChain, selectedToken]);

  return (
    <div className="space-y-4 font-medium text-inter">
      {/* Chain Select */}
      <div className="flex flex-col gap-2 text-start">
        <span>Select Chain</span>
        <select
          id="chain-select"
          name="chainSelect"
          value={selectedChain?.chainId}
          onChange={handleChainChange}
          className="bg-white w-full rounded-md border border-[#000000] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">-- Select a chain --</option>
          {chains.map(chain => (
            <option key={chain.chainId} value={chain.chainId}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      {/* Token Select (only shown if chain is selected) */}
      {selectedChain && (
        <div className="flex flex-col gap-2 text-start">
          <span>Select Token</span>
          <select
            id="token-select"
            name="tokenSelect"
            value={selectedToken?.symbol}
            onChange={handleTokenChange}
            className="bg-white w-full rounded-md border border-[#000000] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">-- Select a token --</option>
            {selectedChain.tokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
            <option value="CUSTOM">Your Token (custom)</option>
          </select>
        </div>
      )}

      {/* Custom address input if "CUSTOM" selected */}
      {selectedToken?.symbol === "CUSTOM" && (
        <div className="flex flex-col gap-2 text-start">
          <span>Enter custom token address</span>
          <input
            type="text"
            id="custom-address"
            name="customAddress"
            value={customInputAddress}
            onChange={handleCustomAddressChange}
            placeholder="0x..."
            className="bg-white w-full rounded-md border border-[#000000] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />

          {/* Show the fetched token name if any */}
          {tokenName && (
            <div className="mt-2 text-gray-800">
              <strong>Token Name:</strong> {tokenName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
