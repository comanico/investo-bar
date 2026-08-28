"use client";

import { useEffect, useState } from "react";
import Timer from "../ui/timer";
import { getNextTargetTime } from "@/actions/getNextTargetTime";

type Props = {
  title: string;
  subtitle?: string;
};

export function HeatmenuHeader({ title, subtitle }: Props) {
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let target = getNextTargetTime();

    const interval = setInterval(() => {
      const now = new Date();
      let difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        target = getNextTargetTime();
        difference = target.getTime() - now.getTime();
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
    <div className="z-10 mb-12 text-center justify-center flex-col flex">
      <h1
        className="mb-6 text-5xl font-extrabold tracking-tight drop-shadow-lg"
        style={{
          textShadow:
            "0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(93,194,59,0.7), 0 0 40px rgba(93,194,59,0.45), 0 0 80px rgba(93,194,59,0.25)",
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-white/60">{subtitle}</p>
      ) : null}
      <div className="leading-none font-bold text-white sm:text-3xl">
        <Timer minutes={minutes} seconds={seconds} />
      </div>
    </div>
  );
}
