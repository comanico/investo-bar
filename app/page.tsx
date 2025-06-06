"use client";
import HeroSection from "@/components/hero-section";
import Features from "@/components/feature";
import FooterSection from "@/components/footer";
import { useEffect, useState } from "react";
import { SelectedPage } from "@/lib/types";
import ContentSection from "@/components/solution";
import CommunitySection from "@/components/about";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPage, setSelectedPage] = useState<SelectedPage>(
    SelectedPage.Home
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
      <HeroSection />
      <Features setSelectedPage={setSelectedPage} />
      <ContentSection setSelectedPage={setSelectedPage}/>
      <CommunitySection setSelectedPage={setSelectedPage}/>
      <FooterSection />
    </>
  );
}
