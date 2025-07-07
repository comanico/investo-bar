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
            A Bar Where the Market Comes to Life.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
            <div className="relative space-y-4">
              <p className="text-muted-foreground">
                At this bar, you&apos;re not just ordering drinks—
                <span className="text-accent-foreground font-bold">
                  you&apos;re participating in a live simulation of the market.
                </span>{" "}
                Prices change based on customer consumption, giving you a
                hands-on understanding of how real-time demand drives value.{" "}
                <span className="text-accent-foreground font-bold">
                  It’s finance made fun, shared with good friends and good
                  vibes.{" "}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeEuro className="size-4" />
                    <h3 className="text-sm font-medium">Financial Literacy</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    According to{" "}
                    <a
                      href="https://europa.eu/eurobarometer/surveys/detail/2953"
                      className="underline text-blue-600"
                    >
                      EU
                    </a>{" "}
                    Romania faces a significant gap in financial education.{" "}
                    <span className="text-accent-foreground font-bold">
                      Investo Bar is here to change that—making finance
                      accessible, social, and engaging.
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="size-4" />
                    <h3 className="text-sm font-medium">Network</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    An experience that blends social energy with professional
                    growth.{" "}
                    <span className="text-accent-foreground font-bold">
                      At Investo Bar, you don’t just meet people—you meet
                      potential.{" "}
                    </span>
                    A place where ideas are born and industries take shape.
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
