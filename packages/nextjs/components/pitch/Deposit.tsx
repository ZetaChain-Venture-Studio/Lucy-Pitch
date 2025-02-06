import React, { useEffect, useState } from "react";

const Deposit = () => {
  return (
    <div className="relative w-full border-2 border-[#000000] rounded-lg shadow-lg bg-white flex flex-col justify-center items-center">
      <div className="w-full flex flex-col items-start py-3 gap-3">
        <div className="w-full flex gap-2 justify-end px-4">
          <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
          <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
          <div className="border-2 border-[#000000] bg-[#FFFFFF] w-5 h-5 rounded-full" />
        </div>

        <span className="px-4 font-inter text-[#002FFF] text-2xl font-[1000]">Coming soon...</span>
        <span className="px-4 font-inter text-[#000000] text-4xl font-[1000]">Deposit Liquidity</span>

        <hr className="w-[90%] border border-[#7B7B7B]" />

        <span className="px-4 text-inter">Invest your assets on the fund and let Lucy manage them</span>

        <div className="relative flex mb-4 mx-4">
          <button className="font-inter bg-[#6C6C6C] text-[#FFFFFF] font-[1000] text-2xl px-4 py-1 border-2 border-[#000000] rounded-2xl z-10">
            Deposit Now
          </button>
          <div className="absolute w-full h-full -bottom-2 -right-2 border-2 border-[#000000] bg-[#FFFFFF] rounded-2xl z-0" />
        </div>
      </div>
    </div>
  );
};

export default Deposit;
