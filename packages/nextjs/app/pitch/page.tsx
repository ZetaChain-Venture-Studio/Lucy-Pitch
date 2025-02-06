"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TransactionFailureModal, TransactionSuccessModal } from "../../components/ResultModal";
import PitchTextarea from "../../components/pitch/PitchTextarea";
import ChainTokenSelector from "../../components/pitch/TokenSelect";
// import ABIconnected from "../../lib/abis/AIC-connected.json";
// import ABI from "../../lib/abis/AIC.json";
import { validateAllocation } from "../../lib/utils";
import Coins from "../../public/assets/coins.png";
import LinkSVG from "../../public/assets/link.svg";
import { ethers } from "ethers";
import { formatUnits, parseAbi, parseUnits } from "viem";
import { useAccount, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import BountyCard from "~~/components/Bounty";
import Leaderboard from "~~/components/Leaderboard";
import Metrics from "~~/components/Metrics";
import MyScore from "~~/components/MyScore";
import TreasuryCard from "~~/components/TreasuryPool";
import Chat from "~~/components/pitch/Chat";
import Deposit from "~~/components/pitch/Deposit";
// import LastPitch from "~~/components/pitch/LastPitches";
import LastPitches from "~~/components/pitch/LastPitches";
// import Winners from "~~/components/pitch/Winners";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { AIC2_ABI } from "~~/lib/abis/AIC";
import { chains } from "~~/lib/constants";
import Lucy_Cross_Arms from "~~/public/assets/lucy_cross_arms.webp";
import Lucy_Glasses from "~~/public/assets/lucy_glasses.webp";
import Lucy_Mocks from "~~/public/assets/lucy_mocks.webp";
import Lucy_Thumbs_Up from "~~/public/assets/lucy_thumps_up.webp";
import { ChainData } from "~~/types/chainData";
import { Token } from "~~/types/token";

/* -------------------------------------------------------------------------- */
/*                               Constants & ABIs                             */
/* -------------------------------------------------------------------------- */

const erc20ABI = parseAbi([
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
]);

const USDC_PRICE = parseUnits("1", 6);
const DEFAULT_APPROVE_PRICE = parseUnits("100", 6);

/* -------------------------------------------------------------------------- */
/*                              Types & Interfaces                            */
/* -------------------------------------------------------------------------- */

export interface FormData {
  token: string;
  tradeType: string;
  allocation: string;
  pitch: string;
  chainId: number;
  tokenName?: string;
}

export interface AIResponse extends FormData {
  aiResponseText: string;
  success: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function Pitch() {
  /* ------------------------------- Local State ------------------------------ */
  const [formData, setFormData] = useState<FormData>({
    token: "",
    tradeType: "buy",
    allocation: "1",
    pitch: "",
    chainId: 7000,
    tokenName: "",
  });

  const [payGameAddress, setPayGameAddress] = useState<string>("0x1Be925E587d8153FaE5ace6f10c97a0073B50787");
  const [usdcAddress, setUsdcAddress] = useState<string>("0x96152E6180E085FA57c7708e18AF8F05e37B479D");

  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");
  const [submissionError, setSubmissionError] = useState("");
  const [refetchFlag, setRefetchFlag] = useState(false);
  const [waitingWhitelist, setWaitingWhitelist] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Data read from backend API
  const [backendData, setBackendData] = useState({
    gamePrice: BigInt(0),
    nonce: BigInt(0),
    signature: "",
  });
  const isPriceLoading = backendData.gamePrice === BigInt(0);

  // Transaction details displayed in modals
  const [txDetails, setTxDetails] = useState<{
    chain: string;
    amount: string;
    token: string;
    transactionHash: string;
  }>({ chain: "", amount: "", token: "", transactionHash: "" });

  // Modals
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [rebalancingState, setRebalancingState] = useState<"idle" | "processing" | "success">("idle");

  // Loading spinner for any in-progress transaction
  const [isTxInProgress, setIsTxInProgress] = useState(false);

  // const [hasPayGameTriggered, setHasPayGameTriggered] = useState(false);

  const [aiSuccess, setAiSuccess] = useState<boolean | null>(null);

  /* ------------------------------- Wagmi Hooks ------------------------------ */
  const { chainId: connectorChainId, address } = useAccount();
  const { switchChain } = useSwitchChain();
  const isZetachain = connectorChainId === 7000;
  const isWrongChain = connectorChainId !== 7000 && connectorChainId !== 137;

  const { data: whitelistedCount, refetch: refetchWhitelist } = useReadContract({
    chainId: chains[0].chainId,
    address: chains[0].aicAddress,
    abi: AIC2_ABI,
    functionName: "whitelist",
    args: address ? [address] : undefined,
  });

  // Read USDC allowance
  const { data: allowanceData = 0n } = useReadContract({
    chainId: connectorChainId,
    address: usdcAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: address ? [address, payGameAddress] : undefined,
  });
  const isApprovalNeeded = allowanceData < USDC_PRICE;

  // Approve contract
  const {
    writeContract: writeApprove,
    isError: isApproveError,
    error: approveError,
    data: approveTxData,
  } = useWriteContract();

  const { isSuccess: isApproveTxSuccess } = useWaitForTransactionReceipt({
    chainId: connectorChainId,
    hash: approveTxData,
  });

  // Pay contract
  const {
    writeContract: writePayGame,
    isError: isPayGameError,
    error: payGameError,
    data: payGameTxData,
  } = useWriteContract();

  const { isSuccess: isPayGameTxSuccess } = useWaitForTransactionReceipt({
    chainId: connectorChainId,
    hash: payGameTxData,
  });

  // Read the user's USDC balance
  const { data: userUSDCBalanceRaw = 0n, refetch: refetchUserUSDCBalance } = useReadContract({
    chainId: connectorChainId,
    address: usdcAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const userUSDCBalance = Number(formatUnits(userUSDCBalanceRaw, 6));

  /* -------------------------------------------------------------------------- */
  /*                                AI Messaging                                */
  /* -------------------------------------------------------------------------- */

  const sendMessage = useCallback(async () => {
    if (!address) {
      setSubmissionError("Please connect your wallet first.");
      console.log("⛔ No wallet, skipping AI call");
      return;
    }

    try {
      const dataToSend = {
        chainId: formData.chainId,
        userAddress: address,
        userMessage: formData,
        swapATargetTokenAddress: chains[0].usdcAddress,
        swapBTargetTokenAddress: formData.token,
      };

      console.log("Sending pitch to AI:", dataToSend);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("AI response:", data);
        setAiSuccess(data.success);
        setRefetchFlag(prev => !prev);
        setSubmissionStatus("success");
        setIsTxInProgress(false);
        console.log("✅ AI call finished");
      } else {
        console.error("AI API call error response:", data);
      }
    } catch (err) {
      console.error("Error during AI call:", err);
    }
  }, [address, formData]);

  /* -------------------------------------------------------------------------- */
  /*                              Side Effects                                  */
  /* -------------------------------------------------------------------------- */

  // Fetch USDC price from the backend API
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("/api/get-price");
        const data = await response.json();
        if (response.ok) {
          console.log(data);

          setBackendData({
            gamePrice: data.price,
            nonce: BigInt(data.nonce),
            signature: data.signature,
          });
        } else {
          console.error("Error fetching price from API:", data);
        }
      } catch (err) {
        console.error("Error fetching price from API:", err);
      }
    };

    fetchPrice();
  }, []);

  // If approve transaction is successful, automatically call payGame
  useEffect(() => {
    if (isApproveTxSuccess) {
      console.log("✅ USDC Approve completed. Calling payGame next...");
      console.log("⏳ Current allowance:", allowanceData.toString());

      writePayGame({
        chainId: connectorChainId,
        address: payGameAddress,
        abi: AIC2_ABI,
        functionName: "payGame",
        args: [backendData.gamePrice, backendData.nonce, backendData.signature],
      });
    }
  }, [isApproveTxSuccess, address, allowanceData, writePayGame]);

  // On payGame success, make the AI call
  useEffect(() => {
    if (!isPayGameTxSuccess) return;
    // setHasPayGameTriggered(true);

    console.log("⏳ Sending pitch to AI...");
    try {
      if (isZetachain) sendMessage();
      else setWaitingWhitelist(true);
    } catch (err) {
      console.error("AI call error:", err);
      setIsFailureModalOpen(true);
    }
  }, [isPayGameTxSuccess]);

  // If we have a successful payGame transaction response, refetch the price and user's USDC balance
  useEffect(() => {
    if (payGameTxData) {
      console.log("✅ payGame transaction response:", payGameTxData);
      refetchUserUSDCBalance();
    }
  }, [payGameTxData]);

  // Approve error
  useEffect(() => {
    if (isApproveError) {
      console.error("Approve error:", approveError);
      setSubmissionStatus("error");
      setSubmissionError("Error: USDC approve transaction failed");
      setIsFailureModalOpen(true);
      setIsTxInProgress(false);
    }
  }, [isApproveError, approveError]);

  // payGame error
  useEffect(() => {
    if (isPayGameError) {
      console.error("payGame error:", payGameError);
      setSubmissionStatus("error");
      setSubmissionError("Error: payGame transaction failed");
      setTxDetails(prev => ({
        ...prev,
        transactionHash: payGameTxData ? payGameTxData : "0x",
      }));
      setIsFailureModalOpen(true);
      setIsTxInProgress(false);
    }
  }, [isPayGameError, payGameError, payGameTxData]);

  // Trigger immediate refetch on mount
  useEffect(() => {
    refetchUserUSDCBalance();
  }, [refetchUserUSDCBalance]);

  useEffect(() => {
    if (waitingWhitelist) {
      if (!intervalIdRef.current) {
        intervalIdRef.current = setInterval(() => {
          console.log("Reading whitelist again...");
          refetchWhitelist();
        }, 7000);
      }
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [waitingWhitelist]);

  useEffect(() => {
    if (waitingWhitelist && whitelistedCount && whitelistedCount > 0) {
      console.log("whitelisted from backend");
      sendMessage();
      setWaitingWhitelist(false);
    }
  }, [whitelistedCount]);

  useEffect(() => {
    if (connectorChainId) {
      const chain = chains.find(c => c.chainId === connectorChainId);
      if (chain) {
        setPayGameAddress(chain.aicAddress);
        setUsdcAddress(chain.usdcAddress);
      }
    }
  }, [connectorChainId]);

  useEffect(() => {
    if (aiSuccess === true) {
      setIsSuccessModalOpen(true);
    }
  }, [aiSuccess]);

  /* -------------------------------------------------------------------------- */
  /*                                 Validation                                 */
  /* -------------------------------------------------------------------------- */

  const isValidPitch = (): boolean => {
    // Check if token is selected
    if (!formData.token) {
      setSubmissionStatus("error");
      setSubmissionError("Please select a token before submitting your pitch.");
      return false;
    }

    if (formData.pitch.length > 1000) {
      setSubmissionStatus("error");
      setSubmissionError("Please ensure your pitch is less than 1000 characters.");
      return false;
    }

    const regex = /^[A-Za-z0-9\s.,$+=_@%&*!?;:'"()—-]*$/;
    if (!regex.test(formData.pitch)) {
      const invalidChars = formData.pitch.match(/[^A-Za-z0-9\s.,$+=_@%&*!?;:'"()—-]/g);
      setSubmissionStatus("error");
      setSubmissionError(
        `Pitch contains invalid characters: ${Array.from(new Set(invalidChars)).join("")}. Only letters, numbers, and common punctuation are allowed.`,
      );
      return false;
    }

    // Allocation
    const allocationValidation = validateAllocation(formData.allocation);
    if (!allocationValidation.isValid) {
      setSubmissionStatus("error");
      setSubmissionError(allocationValidation.message || "Invalid allocation");
      return false;
    }

    return true;
  };

  /* -------------------------------------------------------------------------- */
  /*                             Transaction Logic                              */
  /* -------------------------------------------------------------------------- */

  const executeTransaction = async () => {
    try {
      if (isApprovalNeeded) {
        if (!writeApprove) {
          setSubmissionError("Approve function not configured properly.");
          setIsTxInProgress(false);
          return;
        }

        console.log("⏳ Calling USDC approve... Current allowance:", allowanceData.toString());
        writeApprove({
          chainId: connectorChainId,
          address: usdcAddress,
          abi: erc20ABI,
          functionName: "approve",
          args: [payGameAddress, DEFAULT_APPROVE_PRICE],
        });
      } else {
        if (!writePayGame) {
          setSubmissionError("payGame function not configured properly.");
          setIsTxInProgress(false);
          return;
        }

        console.log("⏳ Calling payGame...");

        writePayGame({
          chainId: connectorChainId,
          address: payGameAddress,
          abi: AIC2_ABI,
          functionName: "payGame",
          args: [backendData.gamePrice, backendData.nonce, backendData.signature],
        });
      }
    } catch (error) {
      console.error("executeTransaction error:", error);
      setIsTxInProgress(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                Event Handlers                              */
  /* -------------------------------------------------------------------------- */

  const handleSubmitPitch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    // Reset game
    // setHasPayGameTriggered(false);
    setAiSuccess(null);

    // Validate pitch & other input fields
    if (!isValidPitch()) return;

    // Check wallet connection
    if (!address) {
      console.log("⛔ No wallet connected");
      setSubmissionError("Please connect your wallet first.");
      return;
    }

    const needed = backendData.gamePrice;
    if (userUSDCBalanceRaw < needed) {
      setSubmissionError(
        `You do not have enough USDC.BASE. You need at least ${Number(needed).toFixed(2)} but only have ${userUSDCBalance.toFixed(2)}.`,
      );
      setSubmissionStatus("error");
      return;
    }

    // Reset any previous error banners
    setSubmissionStatus("idle");
    setSubmissionError("");
    setIsTxInProgress(true);

    // =============================================================================================================
    // =============================================================================================================
    // =============================================================================================================
    // =============================================================================================================

    if (whitelistedCount && whitelistedCount > 0) sendMessage();
    else executeTransaction();
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmissionStatus("idle");
    setSubmissionError("");
  };

  const handleChainTokenSelect = (chain: ChainData | undefined, token: Token | undefined) => {
    setFormData(prev => ({
      ...prev,
      chainId: chain ? chain.chainId : 7000,
      token: token ? token?.address : "",
      tokenName: token ? token.symbol : "",
    }));
  };

  /* ------------------------------- Helper Functions ------------------------------ */
  const getLucyImage = () => {
    if (isTxInProgress) return Lucy_Cross_Arms;

    if (submissionError.startsWith("You do not have enough")) {
      return Lucy_Mocks;
    }

    if (aiSuccess === true) {
      return Lucy_Thumbs_Up;
    }
    if (aiSuccess === false) {
      return Lucy_Mocks;
    }

    return Lucy_Glasses;
  };

  /* -------------------------------------------------------------------------- */
  /*                                  Render                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <div>
        <LastPitches />
      </div>

      <div className="w-full max-w-[80vw] flex flex-col lg:flex-row gap-10 px-4 mx-auto sm:px-6 lg:px-8 justify-center max-lg:items-center">
        {/* Left panel: Bounty, Lucy's image, Treasury, and Score */}
        <div className="flex-shrink-0 flex flex-col gap-6 items-center w-[500px]">
          <BountyCard _refetchScoreFlag={refetchFlag} />

          <div className="w-full h-[500px] flex overflow-y-hidden">
            <div className="relative w-full border-2 border-[#000000] bg-[#FFFFFF] rounded-box">
              <div className="w-full flex justify-between items-center px-8 py-3">
                <span className="font-inter font-[1000] text-3xl">{"// Lucy"}</span>
                <div className="flex gap-2">
                  <div className="border-2 border-[#000000] bg-[#00E353] w-5 h-5 rounded-full" />
                  <div className="border-2 border-[#000000] bg-[#FFDA52] w-5 h-5 rounded-full" />
                  <div className="border-2 border-[#000000] bg-[#002FFF] w-5 h-5 rounded-full" />
                </div>
              </div>

              <hr className="w-full border border-[#000000]" />

              <div className="w-full h-full p-8 flex flex-col gap-6">
                <Image src={getLucyImage()} alt="AI Capital" className="w-full rounded-box" />
              </div>
              <div className="absolute w-full bottom-0 flex justify-between px-5 py-2 bg-[#002FFF6B]/40 backdrop-blur-sm text-[#FFFFFF] font-inter font-[1000] text-lg rounded-b-box">
                <div className="flex">
                  <span className="rotate-180 mr-1">👀</span>
                  <span>2,23453w</span>
                </div>
                <span>👉 Share</span>
                <span>👍 1,7564w</span>
              </div>
            </div>
          </div>

          <TreasuryCard _refetchScoreFlag={refetchFlag} />
          <Deposit />
          {/* {address && <MyScore _refetchScoreFlag={refetchFlag} />} */}

          <Metrics _refetchScoreFlag={refetchFlag} />
          <Leaderboard _refetchScoreFlag={refetchFlag} />
          {/* <Winners _refetchScoreFlag={refetchFlag} /> */}
          {/* <WinningPrompts _refetchScoreFlag={refetchFlag} /> */}
        </div>

        {/* Right panel: Pitch submission and chat */}
        <div className="flex-grow max-w-3xl">
          <div className="p-8 bg-white rounded-lg shadow-sm text-center flex flex-col gap-3 relative">
            <span className="text-6xl font-inter font-[1000] text-[#000000] text-center">Pitch to Lucy and Win</span>

            <div className="font-inter text-[#002FFF] text-xl flex flex-col font-[1000]">
              <span>Select a token, a chain, and create your pitch,</span>
              <span>Lucy will decide its worthiness.</span>
            </div>

            <form onSubmit={handleSubmitPitch} className="flex flex-col gap-6">
              <ChainTokenSelector onSelect={handleChainTokenSelect} />

              <div className="flex flex-col">
                {/* <span>chain id {formData.chainId}</span>
                <span>selected token {formData.token}</span>
                <span>contract {payGameAddress}</span>
                <span>usdc address {usdcAddress}</span> */}
                {/* <span>whitelisted count: {whitelistedCount ?? "Loading"}</span> */}
                {/* <span>connector chain id: {connectorChainId ?? "Loading"}</span>  */}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* <div className="flex-1">
                  <TradeTypeSelect value={formData.tradeType} onChange={handleInputChange} />
                </div> */}
                <div className="flex-1">
                  {/* <AllocationInput value={formData.allocation} onChange={handleInputChange} /> */}
                </div>
              </div>

              <PitchTextarea value={formData.pitch} onChange={handleInputChange} />

              <div className="flex items-center gap-3 text-sm font-inter">
                <div className="w-4 h-4 bg-[#002FFF] rounded-full" />
                <span>Submission Fee: {backendData.gamePrice} USD</span>
                <div className="border border-[#000000] w-4 h-4 rounded-full font-bold text-xs">i</div>
              </div>

              <div className="flex flex-col items-start text-sm font-inter">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#002FFF] rounded-full" />
                  <span className="font-[1000] italic text-base">Main win condition</span>
                </div>
                <span className="flex text-start ml-6">
                  Convince Lucy to buy your token giving the most convincing arguments possible.
                </span>
              </div>

              {/* Error or success banner */}
              {submissionStatus !== "idle" && (
                <div
                  className={`p-4 rounded-md ${
                    submissionStatus === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                  }`}
                >
                  <p>{submissionStatus === "success" ? "Pitch submitted successfully!" : submissionError}</p>
                </div>
              )}

              <span className="italic font-inter font-[1000]">Ready to convince the AI?</span>

              <div className="w-full flex justify-center">
                <div className="w-[400px] relative flex">
                  <button
                    type="submit"
                    disabled={isTxInProgress || isWrongChain}
                    className="px-6 py-2 w-full text-white bg-[#1100FF] border-2 border-[#000000] rounded-box hover:bg-gray-800 flex z-10 justify-center font-inter font-[1000] text-xl"
                  >
                    {isTxInProgress || isPriceLoading ? (
                      <div className="mx-auto w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : !address ? (
                      "Wallet not connected"
                    ) : isWrongChain ? (
                      "Wrong Network"
                    ) : (
                      `Submit Pitch`
                    )}
                  </button>
                  <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] rounded-box z-0" />
                </div>
              </div>
            </form>

            {rebalancingState !== "idle" && (
              <div className="absolute w-full h-full rounded-lg bg-[#000000]/50 left-0 top-0 z-30 flex justify-center items-center">
                <div className="bg-white font-inter rounded-xl shadow-md w-[480px] h-[550px] border-2 border-[#000000] flex flex-col justify-between">
                  <div
                    className={`border-b-2 border-[#000000] px-6 py-3 flex w-full ${rebalancingState === "processing" ? "justify-start" : "justify-end"} `}
                  >
                    {rebalancingState === "processing" ? (
                      <span className="text-3xl font-[1000] font-inter">Rebalancing Portfolio…</span>
                    ) : (
                      <button onClick={() => setRebalancingState("idle")} className="text-3xl font-[1000] font-inter">
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
                    )}
                  </div>

                  <div className="w-full h-[90%] p-6 text-start font-medium flex flex-col justify-evenly">
                    {rebalancingState === "processing" ? (
                      <>
                        <span>Lucy is executing the trade.</span>
                        <span>Please wait while we complete the transaction.</span>
                        <div className="mx-auto w-7 h-7 border-2 border-[#00E353] border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        <div className="flex gap-8 items-center">
                          <span className="text-5xl text-[#0A9D40] font-[1000]">Success!</span>
                          <Image src={Coins} alt="coins" className="w-[60px] -rotate-90 -my-10" />
                        </div>
                        <span className="text-[#0A9D40]">
                          Your pitch has reshaped the portfolio and the bounty pool has been sent to your wallet.
                        </span>
                      </>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <BlockieAvatar address={address || "0x4FfA86bb7c6647e65380d9Eb20e6ceB821e6a1cC"} size={30} />
                        <span className="underline">{address || "0x4FfA86bb7c6647e65380d9Eb20e6ceB821e6a1cC"}</span>
                      </div>
                      <span className="ml-8">convinced Lucy to purchase $token</span>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <div className="flex gap-2 items-center">
                        <div className="min-w-4 w-4 min-h-4 h-4 rounded-full bg-[#002FFF] border-2 border-[#000000]" />
                        <span className="font-[1000]">TRX ID:</span>
                        <span className="underline">0x12a3d4re6...562edc4d2d2</span>
                        <Link
                          href={`https://zetachain.blockscout.com/tx/0x12a3d4re6...562edc4d2d2`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#FFDA52] border-2 border-[#000000] rounded-full p-1 flex items-center justify-center"
                        >
                          <button>
                            <Image src={LinkSVG} alt="link" className="w-4" />
                          </button>
                        </Link>
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="min-w-4 w-4 min-h-4 h-4 rounded-full bg-[#002FFF] border-2 border-[#000000]" />
                        <span className="font-[1000]">Purchased amount:</span>
                        <span className="text-2xl bg-[#FFDA52] text-[#002FFF] rounded px-1 font-[1000]">$750</span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="min-w-4 w-4 min-h-4 h-4 rounded-full bg-[#002FFF] border-2 border-[#000000]" />
                        <span className="font-[1000]">Bounty Received:</span>
                        <span className="text-2xl bg-[#02FF0B] text-[#002FFF] rounded px-1 font-[1000]">$750</span>
                      </div>
                    </div>

                    <div />

                    <hr className="w-full border border-[#7B7B7B]/75" />

                    <div className="flex gap-2 ml-4 items-end">
                      <span className="text-[#002FFF] text-2xl font-[1000]">Round 1</span>
                      <span>is finished,</span>
                    </div>

                    <div className="flex gap-2 ml-4 items-end">
                      <span>Next round will start at</span>
                      <span className="text-[#002FFF] text-2xl font-[1000]">10:00AM UTC</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <MyScore _refetchScoreFlag={refetchFlag} />

          <Chat _refetchChatFlag={refetchFlag} />
        </div>
      </div>

      {/* Transaction Modals (Success / Failure) */}
      <TransactionSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        chain={txDetails.chain}
        amount={txDetails.amount}
        token={txDetails.token}
        transactionHash={txDetails.transactionHash}
      />
      <TransactionFailureModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        reason="Transaction Failed"
        chain={txDetails.chain || ""}
        transactionHash={txDetails.transactionHash}
        error={submissionError}
      />
    </div>
  );
}
