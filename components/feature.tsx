"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SelectedPage } from "@/lib/types";
import { Settings2, Sparkles, Zap } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  setSelectedPage: (value: SelectedPage) => void;
};

export default function Features({ setSelectedPage }: Props) {
  return (
    <section className="py-16 md:py-32" id="feature">
      <motion.div onViewportEnter={() => setSelectedPage(SelectedPage.Feature)}>
        <div className="@container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
              Investo Bar
            </h2>
            <p className="mt-4">A place where you can</p>
          </div>
          <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 [--color-background:var(--color-muted)] [--color-card:var(--color-muted)] *:text-center md:mt-16 dark:[--color-muted:var(--color-zinc-900)]">
            <Card className="group border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Settings2 color="#5dc23b" className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-medium">Network</h3>
              </CardHeader>

              <CardContent>
                <p className="text-sm">
                  Get to know people who are interested in knowing more about
                  finance, economics & accounting.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Zap color="#5dc23b" className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-medium">Learn</h3>
              </CardHeader>

              <CardContent>
                <p className="mt-3 text-sm">
                  The way we sell in this bar, you&#39;ll understand how the
                  markets work by how supply & demand affects prices.
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Sparkles color="#5dc23b" className="size-6" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-medium">Have Fun</h3>
              </CardHeader>

              <CardContent>
                <p className="mt-3 text-sm">
                  Being still a bar and with our variable prices you can enjoy
                  drinks at the cheapest prices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div
      aria-hidden
      className="bg-radial to-background absolute inset-0 from-transparent to-75%"
    />
    <div className="dark:bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t bg-white">
      {children}
    </div>
  </div>
);
