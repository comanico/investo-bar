import { SelectedPage } from "@/lib/types";
import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  setSelectedPage: (value: SelectedPage) => void;
};

export default function CommunitySection({ setSelectedPage }: Props) {
  return (
    <section id="about" className="py-16 md:py-32">
      <motion.div onViewportEnter={() => setSelectedPage(SelectedPage.About)}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold">
              When an entrepreneur, lawyer, economist and engineer want to
              help their community grow smarter, stronger, and more connected.
            </h2>
            <p className="mt-6">
              By coming together, enjoying great moments, and learning how
              financial markets really work.
            </p>
          </div>
          <div className="mx-auto mt-12 flex max-w-lg flex-wrap justify-center gap-3">
            <Link
              href="https://www.linkedin.com/in/zorger-raul-350153151/"
              target="_blank"
              title="Raul Zorger"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="Raul Zorger"
                src="zorger.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="https://avocat-nagy-cluj.ro/"
              target="_blank"
              title="Sebastian Gabriel Nagy"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="Sebastian Gabriel Nagy"
                src="sebi.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="https://topdrinks.ro/"
              target="_blank"
              title="Bolos Paul Catalin"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="Bolos Paul Catalin"
                src="catalin.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="https://www.comanico.biz/"
              target="_blank"
              title="Comaniciu Alexandru-Nicolae"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="Comaniciu Alexandru-Nicolae"
                src="Nico.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
