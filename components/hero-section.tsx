"use client";

import React from "react";
import { HeroHeader } from "./header";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import Image from "next/image";
import { SelectedPage } from "@/lib/types";
import { motion } from "framer-motion";

export default function HeroSection() {
  const [selectedPage, setSelectedPage] = React.useState<SelectedPage>(
    SelectedPage.Home
  );
  return (
    <>
      <HeroHeader
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
      />
      <main className="overflow-x-hidden">
        <section id="home">
          <motion.div
            onViewportEnter={() => setSelectedPage(SelectedPage.Home)}
          >
            <div className="pb-24 pt-12 md:pb-32 lg:pb-56 lg:pt-44">
              <div className="relative mx-auto flex max-w-6xl flex-col px-6 lg:block">
                <div className="mx-auto max-w-lg text-center lg:ml-0 lg:w-1/2 lg:text-left">
                  <h1 className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 xl:text-7xl">
                    First bar in Romania where you learn about finance
                  </h1>
                  <p className="mt-8 max-w-2xl text-pretty text-lg">
                    A place where you combine the 2 most precious activities :
                    hanging with your mates and making money
                  </p>

                  {/* <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <Button asChild size="lg" className="px-5 text-base">
                    <Link href="#link">
                      <span className="text-nowrap">Start Building</span>
                    </Link>
                  </Button>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="px-5 text-base"
                  >
                    <Link href="#link">
                      <span className="text-nowrap">Request a demo</span>
                    </Link>
                  </Button>
                </div> */}
                </div>

                <Image
                  className="-z-10 order-first ml-auto h-56 w-full object-contain sm:h-96 lg:absolute lg:inset-0 lg:-right-20 lg:-top-96 lg:order-last lg:h-max lg:w-2/3 lg:object-contain"
                  src="InvestoBar.svg"
                  alt="Abstract Object"
                  height="4000"
                  width="3000"
                />
              </div>
            </div>
          </motion.div>
        </section>
        <section className="bg-background pb-16 md:pb-32">
          <div className="group relative m-auto max-w-6xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-44 md:border-r md:pr-6">
                <p className="text-start text-sm">
                  Brought to you by
                  <img
                    className="mx-auto mt-2 w-full max-w-[150px] h-auto max-h-[100px] object-contain sm:max-w-[200px] sm:max-h-[150px]"
                    src="Logo_TopDrinks.png"
                    alt="Top Drinks"
                  />{" "}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                </p>
              </div>
              <div className="relative py-6 md:w-[calc(100%-11rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  <div className="flex">
                    <Image
                      width="20"
                      className="mx-auto h-30 w-fit"
                      src="Logo_Aperol.svg"
                      alt="Aperol Logo"
                      height="20"
                    />
                  </div>

                  <div className="flex">
                    <Image
                      width="20"
                      className="mx-auto h-30 w-fit"
                      src="Logo_Corona.svg"
                      alt="Corona Logo"
                      height="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      width="20"
                      className="mx-auto h-30 w-fit"
                      src="Logo_Heineken.svg"
                      alt="Heineken Logo"
                      height="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      width="20"
                      className="mx-auto h-35 w-fit"
                      src="Logo_PonteVilloni.svg"
                      alt="Ponte Villoni Logo"
                      height="20"
                    />
                  </div>
                  <div className="flex">
                    <Image
                      width="20"
                      className="mx-auto h-30 w-fit"
                      src="Logo_Tramin.svg"
                      alt="Tramin Logo"
                      height="20"
                    />
                  </div>
                </InfiniteSlider>

                <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                <ProgressiveBlur
                  className="pointer-events-none absolute left-0 top-0 h-full w-20"
                  direction="left"
                  blurIntensity={1}
                />
                <ProgressiveBlur
                  className="pointer-events-none absolute right-0 top-0 h-full w-20"
                  direction="right"
                  blurIntensity={1}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
