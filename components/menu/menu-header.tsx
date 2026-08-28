"use client";

import { getNextTargetTime } from "@/actions/getNextTargetTime";
import Timer from "../ui/timer";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const [minutes, setMinutes] = useState<number>(15);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    let target = getNextTargetTime();

    const interval = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        target = getNextTargetTime();
      }

      const m = Math.max(
        0,
        Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      );
      const s = Math.max(0, Math.floor((difference % (1000 * 60)) / 1000));
      setMinutes(m);
      setSeconds(s);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center text-[#5dc23b] mb-2">
        Investo Society
      </h1>
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        🍹📈 Preturi Live - Evoluție Dinamică a Băuturilor 🍾💸
      </h2>
      <div className="flex justify-center items-center mb-4 text-center sm:px-4 sm:py-2">
        {/* text-align:center; font-size:26px;  color:#fcbf49; margin-bottom:30px; */}
        <span className="leading-none font-bold text-[#fcbf49] sm:text-3xl">
          🔁 Următorul preț în: <Timer minutes={minutes} seconds={seconds} />
        </span>
      </div>
    </div>
  );
}
