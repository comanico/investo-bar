import React from "react";

interface Props {
  minutes: number;
  seconds: number;
}

const Timer: React.FC<Props> = ({ minutes, seconds }) => {
  return (
    <span key={`${minutes}:${seconds}`} className="text-lg leading-none font-bold sm:text-2xl animate-[timerFade_0.8s_ease-in-out]">
      {`${minutes}:${seconds < 10 ? "0" + seconds : seconds}`}
    </span>
  );
};

export default Timer;
