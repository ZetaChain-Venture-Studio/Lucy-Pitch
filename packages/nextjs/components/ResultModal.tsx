"use client";

// for Next.js app router or any client-side usage
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LinkSVG from "../public/assets/link.svg";
import LucyErrorSVG from "../public/assets/lucy-cry.png";
import LucySuccessSVG from "../public/assets/lucy-home.png";
import CopyToClipboard from "react-copy-to-clipboard";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import twitterIcon from "~~/public/assets/icons8-x.svg";

/** Basic modal props for open/close state. */
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

function ResultModal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  // Stop propagation so clicks inside modal won't close it
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-md w-[600px]  border-2 border-[#000000]" onClick={stopPropagation}>
        <div className="border-b-2 border-[#000000] px-6 py-3 flex w-full justify-between">
          <span className="text-3xl font-[1000] font-inter">Submit</span>
          <button onClick={onClose} className="text-3xl font-[1000] font-inter">
            <svg fill="#000000" height="20px" width="20px" viewBox="0 0 512 512">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <g>
                  <g>
                    <polygon points="512,59.076 452.922,0 256,196.922 59.076,0 0,59.076 196.922,256 0,452.922 59.076,512 256,315.076 452.922,512 512,452.922 315.076,256 "></polygon>
                  </g>
                </g>
              </g>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** ---------------------------
 *   SUCCESS MODAL
 * --------------------------- */

/**
 * Props for the transaction success modal.
 * Example fields: token, amount, chain, transactionHash, blockNumber, gasUsed
 */
type TransactionSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  amount: string;
  chain: string;
  transactionHash?: string; // e.g., "0x1234..."
  blockNumber?: number; // e.g., 12345678
  gasUsed?: string; // e.g., "21000"
  discordLink?: string;
};

export function TransactionSuccessModal({
  isOpen,
  onClose,
  token,
  amount,
  chain,
  transactionHash,
  blockNumber,
  gasUsed,
  discordLink,
}: TransactionSuccessModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Hardcoded text for sharing on Twitter
  // const shareText = `I convinced Ai agent to invest ${amount} into ${token} on ${chain}! #AiCapital #ZetaChain https://capital-ai-agent.vercel.app/ `;

  return (
    <ResultModal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center px-6 relative">
        <Image src={LucySuccessSVG} alt="Error" height={220} className="" />

        <div className="h-full font-inter font-[1000] text-[#0A9D40] flex flex-col gap-3 text-center">
          <span className="text-4xl">Transaction Success!</span>
          <span className="text-2xl">Portfolio Updated.</span>
        </div>

        <div className="absolute inset-x-1/2 -translate-x-1/2 -bottom-2 bg-[#FFDA52] border-2 border-[#000000] w-[320px] h-[30px] rounded-full">
          <div className="w-full h-full flex justify-center items-center relative">
            <span className="text-inter font-medium ">
              TRX ID: {transactionHash?.slice(0, 13)}...{transactionHash?.slice(-10)}
            </span>
            <Link
              href={`https://zetachain.blockscout.com/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -right-2 bg-[#FFDA52] border-2 border-[#000000] rounded-full p-1 flex items-center justify-center"
            >
              <button>
                <Image src={LinkSVG} alt="link" className="w-6" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </ResultModal>
  );
}

/** ---------------------------
 *   FAILURE MODAL
 * --------------------------- */

type TransactionFailureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reason: string; // e.g. "Insufficient balance"
  chain: string;
  transactionHash?: string;
  error?: string; // e.g. "revert: out of gas exception"
  blockNumber?: number;
  gasUsed?: string;

  discordLink?: string;
};

export function TransactionFailureModal({
  isOpen,
  onClose,
  reason,
  chain,
  transactionHash,
  error,
  blockNumber,
  gasUsed,
  discordLink,
}: TransactionFailureModalProps) {
  // const [copySuccess, setCopySuccess] = useState(false);

  return (
    <ResultModal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center px-6 relative">
        <Image src={LucyErrorSVG} alt="Error" height={220} className="" />

        <div className="h-full font-inter font-[1000] text-[#E43936] flex flex-col gap-3">
          <span className="text-4xl">Transaction Failed!</span>
          <span className="text-2xl">ERROR: {reason}</span>
        </div>

        <div className="absolute inset-x-1/2 -translate-x-1/2 -bottom-2 bg-[#FFDA52] border-2 border-[#000000] w-[320px] h-[30px] rounded-full">
          <div className="w-full h-full flex justify-center items-center relative">
            <span className="text-inter font-medium ">
              TRX ID: {transactionHash?.slice(0, 13)}...{transactionHash?.slice(-10)}
            </span>
            <Link
              href={`https://zetachain.blockscout.com/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -right-2 bg-[#FFDA52] border-2 border-[#000000] rounded-full p-1 flex items-center justify-center"
            >
              <button>
                <Image src={LinkSVG} alt="link" className="w-6" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </ResultModal>
  );
}

/** ---------------------------
 *   PROMPT SUCCESS (optional)
 * --------------------------- */
type PromptSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  tokenFrom: string;
  tokenTo: string;
  amountFrom: number;
  amountTo: number;
  chain: string;
  estimatedTime: number;
  prizeCollected: number;
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-gray-500 mx-auto my-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function TokenLoader({ token }: { token: string }) {
  return (
    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gray-200 animate-pulse mb-4">
      <span className="text-lg font-bold">{token}</span>
    </div>
  );
}

export function PromptSuccessModal({
  isOpen,
  onClose,
  userName,
  tokenFrom,
  tokenTo,
  amountFrom,
  amountTo,
  chain,
  estimatedTime,
  prizeCollected,
}: PromptSuccessModalProps) {
  const [status, setStatus] = useState<"waiting" | "success">("waiting");

  useEffect(() => {
    if (isOpen) {
      setStatus("waiting");
      const timer = setTimeout(() => {
        setStatus("success");
      }, estimatedTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, estimatedTime]);

  return (
    <ResultModal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">
          {status === "waiting" ? "Rebalancing Portfolio" : "Rebalancing Complete"}
        </h2>
        <div className={`p-4 rounded-md ${status === "success" ? "bg-green-100" : "bg-gray-100"}`}>
          {status === "waiting" ? (
            <>
              <TokenLoader token={tokenFrom} />
              <p>
                Swapping {amountFrom} {tokenFrom} for {amountTo} {tokenTo}
              </p>
              <p className="mt-1">on {chain} chain</p>
              <p className="mt-1">Estimated wait time: {estimatedTime} seconds</p>
              <Spinner />
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 mb-2 text-green-500">
                <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 
                       8 8 0 000 16zm3.707-10.293a1 
                       1 0 00-1.414-1.414L9 9.586 
                       7.707 8.293a1 1 0 00-1.414 
                       1.414l2 2a1 1 0 001.414 
                       0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>
                Successfully swapped {amountFrom} {tokenFrom} for {amountTo} {tokenTo}
              </p>
              <p className="mt-1">on {chain} chain</p>
              <p className="mt-2">Congratulations, {userName}!</p>
              <p className="mt-1">Prize collected: ${prizeCollected}</p>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          disabled={status === "waiting"}
          className={`mt-4 px-4 py-2 rounded ${
            status === "waiting" ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-500 text-white"
          }`}
        >
          {status === "waiting" ? "Please wait..." : "Close"}
        </button>
      </div>
    </ResultModal>
  );
}
