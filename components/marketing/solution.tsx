import { BadgeEuro, ArrowLeftRight } from "lucide-react";
import { ChartLineInteractive } from "../chart/chart-line-interactive";
import { motion } from "framer-motion";
import { SelectedPage } from "@/lib/types";
import { useTranslation } from "react-i18next";

type Props = {
  setSelectedPage: (value: SelectedPage) => void;
};

export default function Solution({ setSelectedPage }: Props) {
  const { t } = useTranslation();

  return (
    <section id="solution" className="py-16 md:py-32">
      <motion.div
        onViewportEnter={() => setSelectedPage(SelectedPage.Solution)}
      >
        <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
          <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
            {t("solution.title")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
            <div className="relative space-y-4">
              <p className="text-muted-foreground">
                {t("solution.description")}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeEuro className="size-4" />
                    <h3 className="text-sm font-medium">
                      {t("solution.financial_literacy.title")}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("solution.financial_literacy.description")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="size-4" />
                    <h3 className="text-sm font-medium">
                      {t("solution.network.title")}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("solution.network.description")}
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
