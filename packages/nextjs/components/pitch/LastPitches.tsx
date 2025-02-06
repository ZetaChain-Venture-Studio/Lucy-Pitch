import { useEffect, useState } from "react";
import { BlockieAvatar } from "../scaffold-eth";

const LastPitches = () => {
  const [pitches, setPitches] = useState<{ id: string; address: string; date: string }[]>([]);

  useEffect(() => {
    async function fetchPitches() {
      try {
        const res = await fetch("/api/paginated-chat?limit=10");
        if (!res.ok) throw new Error("Failed to fetch pitches");
        const data = await res.json();
        setPitches(
          data.data.map((item: any) => ({
            id: item.id,
            address: item.userAddress,
            date: item.timestamp,
          })),
        );
      } catch (error) {
        console.error(error);
      }
    }
    fetchPitches();
  }, []);

  return (
    <div className="relative flex flex-col gap-6 w-full overflow-x-hidden py-4 shadow-inner">
      <div className="relative overflow-x-hidden overflow-y-visible h-[60px]">
        <div className="flex animate-marquee whitespace-nowrap">
          {pitches.map(pitch => (
            <div key={pitch.id} className="relative flex-shrink-0 flex w-[300px] h-[50px] mr-8">
              <div className="w-[300px] h-[40px] border-2 border-black bg-white rounded-box font-inter font-[1000] text-base flex gap-2 items-center justify-center z-10 px-4 py-1">
                <BlockieAvatar address={pitch.address} size={30} />
                <span>{pitch.address.slice(0, 6) + "..." + pitch.address.slice(-4)}</span>
                <span className="font-medium">Last {getRelativeTime(pitch.date)}</span>
              </div>
              {/* The shadow element with negative offsets */}
              <div className="absolute w-[300px] h-[40px] -bottom-0 -right-2 border-2 border-black bg-white rounded-box z-0" />
            </div>
          ))}
          {/* second time for smoother animation */}
          {pitches.map(pitch => (
            <div key={`${pitch.id}-duplicate`} className="relative flex-shrink-0 flex w-[300px] h-[50px] mr-8">
              <div className="w-[300px] h-[50px] border-2 border-black bg-white rounded-box font-inter font-[1000] text-base flex gap-2 items-center justify-center z-10 px-4 py-2">
                <BlockieAvatar address={pitch.address} size={30} />
                <span>{pitch.address.slice(0, 6) + "..." + pitch.address.slice(-4)}</span>
                <span className="font-medium">Last {getRelativeTime(pitch.date)}</span>
              </div>
              <div className="absolute w-[300px] h-[50px] -bottom-0 -right-2 border-2 border-black bg-white rounded-box z-0" />
            </div>
          ))}
        </div>
      </div>
      <span className="font-inter font-[1000] italic text-base px-6 opacity-50">Last pitches</span>
      {/* Marquee animation CSS */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LastPitches;

export function getRelativeTime(timestamp: string): string {
  // Convert "2025-02-05 00:17:55.827991" into a proper ISO string.
  // Split on the dot to truncate microseconds to milliseconds.
  const parts = timestamp.split(".");
  let formattedTimestamp: string;
  if (parts.length === 2) {
    // Take only the first 3 digits (milliseconds) of the fractional part.
    const ms = parts[1].substring(0, 3);
    formattedTimestamp = `${parts[0].replace(" ", "T")}.${ms}Z`;
  } else {
    formattedTimestamp = `${timestamp.replace(" ", "T")}Z`;
  }

  // Create the Date object from the formatted timestamp.
  const date = new Date(formattedTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000); // convert ms to minutes

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
}
