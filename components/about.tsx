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
              A entrepreneur, lawyer, economist and engineer wanting to better
              it&apos;s community.
            </h2>
            <p className="mt-6">
              By getting together, having a good time while understanding the
              markets.
            </p>
          </div>
          <div className="mx-auto mt-12 flex max-w-lg flex-wrap justify-center gap-3">
            <Link
              href="/"
              target="_blank"
              title="Méschac Irung"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="John Doe"
                src="zorger.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="/"
              target="_blank"
              title="Méschac Irung"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="John Doe"
                src="sebi.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="/"
              target="_blank"
              title="Méschac Irung"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="John Doe"
                src="catalin.jpg"
                loading="lazy"
                width={120}
                height={120}
              />
            </Link>
            <Link
              href="/"
              target="_blank"
              title="Méschac Irung"
              className="size-16 rounded-full border *:size-full *:rounded-full *:object-cover"
            >
              <img
                alt="John Doe"
                src="alex.jpg"
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
