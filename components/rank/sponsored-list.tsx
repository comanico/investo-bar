"use client";

import { InfiniteSlider } from "@/components/ui/infinite-slider";
import Image from "next/image";

const SPONSORS = [
  { src: "/InvestoBarIcon.svg", alt: "InvestoBar" },
  { src: "/Logo_XSpace.png", alt: "XSpace" },
  { src: "/Logo_TopDrinks.png", alt: "TopDrinks" },
];

export function SponsorRail({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="relative hidden h-[72vh] w-28 shrink-0 overflow-hidden lg:block">
      <InfiniteSlider
        direction="vertical"
        reverse={reverse}
        speed={22}
        gap={48}
        className="h-full"
      >
        {SPONSORS.map((s) => (
          <div key={s.alt} className="flex h-28 w-28 items-center justify-center">
            <Image
              src={s.src}
              alt={s.alt}
              width={64}
              height={64}
              className="h-24 w-24 object-contain opacity-90"
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}