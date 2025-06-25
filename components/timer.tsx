import React from "react";

interface Props {
  minutes: number;
  seconds: number;
}

const Timer: React.FC<Props> = ({ minutes, seconds }) => {
  return (
    <span className="text-lg leading-none font-bold sm:text-2xl">
      {`${minutes}:${seconds < 10 ? "0" + seconds : seconds}`}
    </span>
  );
};

export default Timer;
