"use client";
// React
import { useEffect, useState } from "react";
import { SelectedPage } from "@/lib/types";

// Scroller
import I18nProvider from "@/components/ui/i18n-provider";

// Sections
import About from "@/components/marketing/about";
import Solution from "@/components/marketing/solution";
import FooterSection from "@/components/marketing/footer";
import HeroSection from "@/components/marketing/hero-section";
import Reviews from "@/components/marketing/reviews";
import Features from "@/components/marketing/features";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPage, setSelectedPage] = useState<SelectedPage>(
    SelectedPage.Home,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTopOfPage, setIsTopOfPage] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setIsTopOfPage(true);
        setSelectedPage(SelectedPage.Home);
      }
      if (window.scrollY !== 0) {
        setIsTopOfPage(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <I18nProvider>
        <HeroSection />
        <Features setSelectedPage={setSelectedPage} />
        <Solution setSelectedPage={setSelectedPage} />
        <Reviews setSelectedPage={setSelectedPage} />
        <About setSelectedPage={setSelectedPage} />
        <FooterSection />
      </I18nProvider>
    </>
  );
}
