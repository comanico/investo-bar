import { BadgeEuro, ArrowLeftRight } from "lucide-react";
import { ChartLineInteractive } from "./chart-line-interactive";
import { motion } from "framer-motion";
import { SelectedPage } from "@/lib/types";

type Props = {
  setSelectedPage: (value: SelectedPage) => void;
};

export default function ContentSection({ setSelectedPage }: Props) {
  return (
    <section id="solution" className="py-16 md:py-32">
      <motion.div
        onViewportEnter={() => setSelectedPage(SelectedPage.Solution)}
      >
        <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
          <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
            A Bar that simulates the market.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
            <div className="relative space-y-4">
              <p className="text-muted-foreground">
                A bar where the consumption by customers affects the prices in
                real time.{" "}
                <span className="text-accent-foreground font-bold">
                  Learn by enjoying your time with friends.
                </span>{" "}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeEuro className="size-4" />
                    <h3 className="text-sm font-medium">Financial Literacy</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    According to <a href="https://europa.eu/eurobarometer/surveys/detail/2953" className="underline text-blue-600">EU</a> Romania is in need of better financial education.{" "}
                  <span className="text-accent-foreground font-bold">
                    Investo Bar aims to change that.
                  </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="size-4" />
                    <h3 className="text-sm font-medium">Network</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    An event where you don't just have fun, but meet with professionals and exchange ideas.{" "}
                    <span className="text-accent-foreground font-bold">
                      Investo Bar is a place to start ideas and grow industries.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="relative mt-6 sm:mt-0">
              <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                <ChartLineInteractive />{" "}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
