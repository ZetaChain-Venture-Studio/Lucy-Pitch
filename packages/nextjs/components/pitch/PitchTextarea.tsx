"use client";

import React from "react";

interface PitchTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function PitchTextarea({ value, onChange }: PitchTextareaProps) {
  return (
    <div className="flex flex-col gap-2 text-start text-[#000000] font-medium">
      <span>Investment Pitch</span>
      <textarea
        id="pitch"
        name="pitch"
        required
        value={value}
        onChange={onChange}
        rows={4}
        maxLength={1000}
        className=" bg-white w-full rounded-md border border-[#000000] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        placeholder="Explain your investment thesis..."
      />
      <p className="text-sm text-gray-500 mt-1">{1000 - value.length} characters remaining </p>
    </div>
  );
}
