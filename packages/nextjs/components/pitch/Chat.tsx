"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lucy_Circle from "../../public/assets/logo-message.png";
import { BlockieAvatar } from "../scaffold-eth";
import CopyToClipboard from "react-copy-to-clipboard";
import { useAccount } from "wagmi";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import copyIcon from "~~/public/assets/copy.svg";
import twitterIcon from "~~/public/assets/x-logo.svg";
import { AIResponse } from "~~/utils/types/types";

interface ChatProps {
  _refetchChatFlag: boolean;
}

export default function Chat({ _refetchChatFlag }: ChatProps) {
  const { address } = useAccount();
  const [messages, setMessages] = useState<AIResponse[]>([]);
  const [showGlobal, setShowGlobal] = useState(true);
  const [showWinners, setShowWinners] = useState(false);
  const [limit, setLimit] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorRecord, setCursorRecord] = useState<number[]>([]); // Almacena los cursos anteriores
  const [nextCursor, setNextCursor] = useState<number | null>(null); // Cursor para la próxima página
  const [previousFlag, setPreviousFlag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [tokenName, setTokenName] = useState<string | null>("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLimit = Number(e.target.value);
    if (selectedLimit !== limit) {
      setLimit(selectedLimit);
    }
  };

  const getChat = useCallback(async () => {
    setLoading(true);
    let _url = showWinners
      ? `/api/paginated-winning-prompts?limit=${limit}`
      : showGlobal
        ? `/api/paginated-chat?limit=${limit}`
        : `/api/paginated-chat?userAddress=${address}&limit=${limit}`;
    if (currentPage > 1 && nextCursor !== null) _url += `&cursor=${nextCursor}`;
    // console.log(`calling ${_url}`);

    const response = await fetch(_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    // console.log(data);

    if (data) {
      setMessages(data.data);

      if (!previousFlag) {
        setNextCursor(data.nextCursor);
      } else {
        setPreviousFlag(false);
      }

      const trimmedTokenName = data.tokenName?.trim() || "";
      const finalTokenName =
        trimmedTokenName && trimmedTokenName.toLowerCase() !== "unknown"
          ? trimmedTokenName.split(" ")[0]
          : (data.token ?? "");

      setTokenName(finalTokenName);

      setLoading(false);
    }
  }, [limit, showGlobal, showWinners, address, currentPage, previousFlag]);

  const goToNextPage = () => {
    if (nextCursor !== null) {
      setCursorRecord(prev => [...prev, nextCursor]);
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (cursorRecord.length > 0) {
      // const correctIndex = nextCursor !== null ? 1 : 2;
      const previousCursor = cursorRecord[cursorRecord.length - 1];
      setCursorRecord(prev => prev.slice(0, -1));
      setNextCursor(previousCursor);
      setPreviousFlag(true);
      setCurrentPage(prev => prev - 1);
    }
  };

  useEffect(() => {
    getChat();
  }, [getChat, _refetchChatFlag]);

  useEffect(() => {
    if (!address) setShowGlobal(true);
  }, [address]);

  return (
    <div className="py-8 bg-white rounded-lg shadow-sm flex flex-col gap-6">
      <div className="flex justify-between items-center px-10">
        <h1 className="text-4xl font-[1000] text-[#000000] font-inter">Pitches</h1>
        <div className="flex gap-2 w-[360px] h-[50px] border-2 border-[#000000] rounded-full text-2xl font-[1000] font-inter relative">
          <button
            onClick={() => {
              setShowGlobal(true);
              setShowWinners(false);
            }}
            className={`rounded-full w-[120px] h-full absolute left-0 transition-all duration-700 ${showGlobal ? "bg-[#002FFF] text-[#FFFFFF] border-2 border-[#000000] bottom-2" : "text-[#000000] bottom-0"}`}
          >
            All
          </button>
          <button
            onClick={() => {
              setShowWinners(true);
              setShowGlobal(false);
            }}
            className={`rounded-full w-[120px] h-full absolute inset-x-1/2 -translate-x-1/2 transition-all duration-700 ${showWinners ? "bg-[#002FFF] text-[#FFFFFF] border-2 border-[#000000] bottom-2" : "text-[#000000] bottom-0"}`}
          >
            Winners
          </button>
          <button
            onClick={() => {
              setShowGlobal(false);
              setShowWinners(false);
            }}
            className={`rounded-full w-[120px] h-full absolute right-0 transition-all duration-700 ${!address ? "text-stone-500 bottom-0" : !showGlobal && !showWinners ? "bg-[#002FFF] text-[#FFFFFF] border-2 border-[#000000] bottom-2" : "text-[#000000] bottom-0"}`}
            disabled={!address}
          >
            My Post
          </button>
        </div>
      </div>

      <span className="text-lg px-10">
        See everyone that tried to convince Lucy. View pitches and AI responses from all users.
      </span>

      <div className={`w-full min-h-[200px] relative pl-10 ${loading && "blur"} flex flex-col gap-8`}>
        {messages.length > 0 &&
          messages.map((message, index) => (
            <div key={index} className="w-full flex items-center">
              <div className="relative flex flex-col w-[90%]">
                <div
                  className={`relative flex flex-col gap-2 px-6 pt-6 pb-12 rounded-xl border-2 border-[#000000] ${message.success ? "bg-[#C8FFCF] shadow-[_4px_4px_4px_#ffdd00]" : "bg-[#FFE8E8]"} z-10`}
                >
                  <div className="flex justify-between items-center text-lg">
                    <span className="flex font-[1000] font-inter items-center gap-2">
                      <BlockieAvatar address={message.userAddress} size={30} />
                      {"User: "}
                      <span className="">
                        {message.userAddress.slice(0, 6)}...{message.userAddress.slice(-6)}
                      </span>
                    </span>
                    {message.success && (
                      <span className="flex font-[1000] font-inter items-center gap-2">
                        Round:
                        <span className="text-[#002FFF]">1</span>
                      </span>
                    )}
                    <span className="flex font-[1000] font-inter items-center gap-2">
                      {"User score: "}
                      <span className="text-[#002FFF]">{message.score}</span>
                    </span>
                  </div>
                  <p
                    className={`text-sm md:text-base font-medium text-gray-800 break-all ${message.success && "[text-shadow:_4px_4px_4px_#ffdd00]"}`}
                  >
                    {message.pitch}
                  </p>
                  <p className={`text-sm md:text-lg mb-0 text-[#000000] font-[1000] font-inter`}>
                    <span className="inline-flex items-center gap-2 mt-8">
                      <Image src={Lucy_Circle} alt="Lucy" width={32} height={32} />
                      <strong>Lucy:</strong>
                    </span>
                  </p>
                  <p className="break-all mt-0 font-medium">{message.aiResponseText}</p>

                  {/* {message.success && <p className="text-sm text-gray-500">buy 100 usd of {message.token}</p>} */}

                  {message.success && (
                    <div className="flex gap-6 items-center text-lg mt-2">
                      <div className="flex font-[1000] font-inter items-center gap-2">
                        <span>Prize Received:</span>
                        <span className="text-2xl bg-[#FFDA52] text-[#002FFF] rounded px-1">{message.prize}</span>
                      </div>

                      <div className="flex font-[1000] font-inter items-center gap-2">
                        <span>Token Purchased:</span>
                        <span className="text-2xl bg-[#02FF0B] text-[#002FFF] rounded px-1">{tokenName}</span>
                      </div>
                    </div>
                  )}

                  {message.success && (
                    <div className="absolute -bottom-2 left-0 w-full flex gap-4 justify-end px-6">
                      <Link
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          `I pitched to Lucy Ai ${tokenName} https://www.lucycapital.xyz #Zetachain`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="h-[22px] flex gap-1 items-center bg-[#8FF0FF] font-medium text-xs pr-2 rounded-full border-2 border-[#000000]">
                          <div className="rounded-full bg-[#8FF0FF] border-2 border-[#000000] p-1 -ml-2">
                            <Image src={twitterIcon} alt="Twitter" width={14} height={14} />
                          </div>
                          Share
                        </button>
                      </Link>
                      <CopyToClipboard
                        text={message.txId}
                        onCopy={() => {
                          setCopiedIndex(index);
                          setTimeout(() => {
                            setCopiedIndex(null);
                          }, 800);
                        }}
                      >
                        <button className="h-[22px] flex gap-1 items-center bg-[#FFDA52] font-medium text-xs pr-2 rounded-full border-2 border-[#000000]">
                          <div className="rounded-full bg-[#FFDA52] border-2 border-[#000000] p-1 -ml-2">
                            {copiedIndex === index ? (
                              <CheckCircleIcon aria-hidden="true" className="w-[14px] h-[14px]" />
                            ) : (
                              <Image src={copyIcon} alt="Copy" width={14} height={14} />
                            )}
                          </div>
                          TRX ID
                        </button>
                      </CopyToClipboard>
                      {/* <button className="bg-[#FFBDBD] font-medium text-xs px-2 rounded-full border-2 border-[#000000]">1 min ago</button> */}
                    </div>
                  )}
                </div>
                <div className="absolute w-full h-full -right-3 -bottom-3 border-2 border-[#000000] rounded-xl z-0" />
              </div>
              {message.success && (
                <span
                  className="ml-1 text-[#00E353] font-[1000] italic text-7xl"
                  style={{ writingMode: "vertical-rl" }}
                >
                  WIN !
                </span>
              )}
            </div>
          ))}
      </div>

      <div className="w-full flex gap-6 justify-center items-center mt-8">
        <div className="relative flex justify-center border-2 border-[#000000] rounded-full w-[250px] h-[40px]">
          <button
            onClick={goToPreviousPage}
            className={`absolute left-0 bottom-2 h-[40px] ${cursorRecord.length > 0 ? "bg-[#FFFFFF]" : "bg-stone-400"} border-2 border-[#000000] rounded-full px-4 font-[1000] font-inter text-[#000000]`}
            disabled={cursorRecord.length === 0}
          >
            {"<< Prev"}
          </button>
          <div className="rounded-full px-4 py-2 font-[1000] font-inter text-[#000000]">{currentPage}</div>
          <button
            onClick={goToNextPage}
            className={`absolute right-0 bottom-2 h-[40px] ${nextCursor !== null ? "bg-[#FFFFFF]" : "bg-stone-400"} border-2 border-[#000000] rounded-full px-4 font-[1000] font-inter text-[#000000]`}
            disabled={nextCursor === null}
          >
            {"Next >>"}
          </button>
        </div>

        <select
          id="limit-select"
          name="limit-select"
          onChange={handleSelectChange}
          className="bg-white rounded-2xl font-[1000] font-inter text-[#000000] border-2 border-[#000000] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>
      </div>
    </div>
  );
}
