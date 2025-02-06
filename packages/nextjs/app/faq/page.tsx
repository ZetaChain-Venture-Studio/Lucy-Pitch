"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PolygonSVG from "../../public/assets/polygon.png";
import { faqSections } from "~~/lib/faq";

export default function FaqPage() {
  const [section, setSection] = useState("Gameplay");
  const currentSectionFaqs = faqSections.find(s => s.name === section);
  const [openIndexes, setOpenIndexes] = useState(new Array(currentSectionFaqs?.faqs.length).fill(false));

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const toggleOpen = (index: number) => {
    setOpenIndexes(prevState => {
      const newState = [...prevState];
      newState[index] = !newState[index];
      return newState;
    });
  };

  useEffect(() => {
    setOpenIndexes(new Array(currentSectionFaqs?.faqs.length).fill(false));
  }, [section]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return; // Evita errores si el ref aún es null

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const percentage = (scrollTop / maxScroll) * 100;
      setScrollPosition(percentage);
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-100 p-8 font-inter flex justify-center font-[1000]">
      <div className="w-full max-w-[80vw] flex flex-col gap-4 items-start">
        <div className="flex gap-12 w-1/2">
          <span className="text-7xl text-center">FAQ</span>
          <span className="text-2xl">
            Find detailed explanations about gameplay, pitching rules, rewards, and more.
          </span>
        </div>

        <div className="relative w-full flex flex-col mt-8">
          <div className="relative w-full flex justify-end items-center rounded-t-3xl border-2 border-[#000000] bg-[#FFFFFF] p-5">
            <button
              className={`absolute bottom-0 left-0 w-[20%] ${section === "Gameplay" ? "z-[5] h-[110%] bg-[#002FFF] text-[#FFFFFF]" : "z-[4] h-full bg-[#FFFFFF]"} border-2 rounded-t-3xl text-2xl border-[#000000]`}
              onClick={() => setSection("Gameplay")}
            >
              {"// Gameplay"}
            </button>

            <button
              className={`absolute bottom-0 left-[18%] w-[20%] ${section === "Pitching rules" ? "z-[5] h-[110%] bg-[#002FFF] text-[#FFFFFF]" : "z-[3] h-full bg-[#FFFFFF]"} border-2 rounded-t-3xl text-2xl border-[#000000]`}
              onClick={() => setSection("Pitching rules")}
            >
              {"// Pitching rules"}
            </button>

            <button
              className={`absolute bottom-0 left-[36%] w-[20%] ${section === "Rewards" ? "z-[5] h-[110%] bg-[#002FFF] text-[#FFFFFF]" : "z-[2] h-full bg-[#FFFFFF]"} border-2 rounded-t-3xl text-2xl border-[#000000]`}
              onClick={() => setSection("Rewards")}
            >
              {"// Rewards"}
            </button>

            <button
              className={`absolute bottom-0 left-[54%] w-[20%] ${section === "Others" ? "z-[5] h-[110%] bg-[#002FFF] text-[#FFFFFF]" : "z-[1] h-full bg-[#FFFFFF]"} border-2 rounded-t-3xl text-2xl border-[#000000]`}
              onClick={() => setSection("Others")}
            >
              {"// Others"}
            </button>

            <div className="flex gap-2">
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
              <div className="border-2 border-[#000000] bg-[#FFFFFF] w-6 h-6 rounded-full" />
            </div>
          </div>

          <div
            ref={scrollRef}
            className="w-full border-b-2 border-x-2 border-[#000000] bg-[#FFFFFF] h-[800px] py-12 pl-12 pr-28 flex flex-col gap-8 overflow-y-scroll no-scrollbar"
          >
            {currentSectionFaqs?.faqs.map((_faq, index) => (
              <div key={index} className="flex flex-col gap-6">
                <button className="w-full flex justify-between items-center z-10" onClick={() => toggleOpen(index)}>
                  <div className="flex gap-4 items-end">
                    <span className="text-6xl font-bold text-[#002FFF]">{index + 1}.</span>
                    <span className="text-2xl mb-1">{_faq.question}</span>
                  </div>

                  <div>
                    <Image
                      src={PolygonSVG}
                      alt="dropdown"
                      width={20}
                      className={`${!openIndexes[index] && "rotate-90"} transition-all duration-500`}
                    />
                  </div>
                </button>

                <div
                  className={`transition-all duration-700 ease origin-top
                ${openIndexes[index] ? "scale-y-1" : "scale-y-0 opacity-0"} 
                w-[96%] flex z-0`}
                >
                  {openIndexes[index] && (
                    <div className="w-full px-6">
                      <span className="text-lg font-medium">{_faq.answer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="absolute bg-[#000000] w-[3px] h-[70%] inset-y-1/2 -translate-y-1/2 right-[3%] rounded-lg">
              <div
                className="absolute w-6 h-6 bg-[#FFFFFF] border-2 border-[#000000] rounded-full -left-3"
                style={{ top: `${scrollPosition}%`, transition: "top 0.1s linear" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
