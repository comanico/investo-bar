"use client";

import Counter from "./ui/counter";

interface Props {
  minutes: number;
  seconds: number;
}

const Timer: React.FC<Props> = ({ minutes, seconds }) => {
  return (
    <span className="inline-flex items-center gap-1 font-bold leading-none">
      <Counter
        value={minutes}
        fontSize={40}
        places={[10, 1]}
        gap={2}
        horizontalPadding={0}
        borderRadius={0}
        padding={0}
        gradientHeight={0}
        gradientFrom="transparent"
        gradientTo="transparent"
        fontWeight={700}
        textColor="inherit"
        containerStyle={{ background: "transparent" }}
        counterStyle={{ background: "transparent", padding: 0 }}
        digitStyle={{ background: "transparent", width: "0.65em" }}
      />
      <span className="text-3xl sm:text-4xl pb-0.5">:</span>

      <Counter
        value={seconds}
        fontSize={40}
        places={[10, 1]}
        gap={2}
        horizontalPadding={0}
        borderRadius={0}
        padding={0}
        gradientHeight={0}
        gradientFrom="transparent"
        gradientTo="transparent"
        fontWeight={700}
        textColor="inherit"
        containerStyle={{ background: "transparent" }}
        counterStyle={{ background: "transparent", padding: 0 }}
        digitStyle={{ background: "transparent", width: "0.65em" }}
      />
    </span>
  );
};

export default Timer;
