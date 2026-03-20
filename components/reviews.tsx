"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { SelectedPage } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";

type Props = {
  setSelectedPage: (value: SelectedPage) => void;
};

export default function Reviews({ setSelectedPage }: Props) {
  const { t } = useTranslation();
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  const videos = [
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83ODMuUrHn7NIr0teM5g4K1SlzAUEwfVLZda96",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI838sX1bhNAX0r2KSatPqsIb8gzuVLeyC4vGY5M",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI836u60x0niOo3SLI8ehxsAQaCFfqkdPlGcVZvK",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83zUR6ums7G3WtVXgpvAONwhfqFKU912eLcCbJ",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83jFOP7kNM89FuXbkNQ4OG0WVrSqc37wRoPAUi",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83RhGQb8IrexQZ2VyCuoSnhz1pkLI6vYTG4qNi",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83qqlYkAZ39NIhinvumTtprQFDgWSlXeHJjfMa",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83QltKPvb5Soa53jsJrNAMmvxzq4WyPe6kHcKi",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83LroeAQ3z2pjW3YCFQTXw0M4omcxrNbSKyZg6",
      title: "",
      poster: "",
    },
    {
      src: "https://x0raaxhwsi.ufs.sh/f/ZXKDC8UOQI83lnpsfAtag5c2xzGhy9VEBl73n4WZRHN8SFms",
      title: "",
      poster: "",
    },
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 overflow-hidden" id="reviews">
      <motion.div onViewportEnter={() => setSelectedPage(SelectedPage.Reviews)}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight">
              {t("reviews.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("reviews.description")}
            </p>
          </div>

          <div className="relative">
            <div
              ref={prevRef}
              className="absolute left-[-3rem] md:left-[-4rem] top-1/2 -translate-y-1/2 z-20 cursor-pointer 
    bg-[#5dc23b] hover:bg-[#4eb02f] text-white rounded-full p-4 shadow-xl 
    hover:scale-110 transition-all duration-300 backdrop-blur-sm 
    border border-[#4eb02f]/40 hidden md:flex items-center justify-center"
            >
              <ChevronLeft size={32} strokeWidth={3} />
            </div>

            <div
              ref={nextRef}
              className="absolute right-[-3rem] md:right-[-4rem] top-1/2 -translate-y-1/2 z-20 cursor-pointer 
    bg-[#5dc23b] hover:bg-[#4eb02f] text-white rounded-full p-4 shadow-xl 
    hover:scale-110 transition-all duration-300 backdrop-blur-sm 
    border border-[#4eb02f]/40 hidden md:flex items-center justify-center"
            >
              <ChevronRight size={32} strokeWidth={3} />
            </div>
          </div>

          <Swiper
            modules={[Navigation, Autoplay, EffectFade]}
            spaceBetween={24}
            slidesPerView={1}
            centeredSlides={true}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: true,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 1.2,
                spaceBetween: 16,
                centeredSlides: true,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 24,
                centeredSlides: false,
              },
              1024: {
                slidesPerView: 2.5,
                spaceBetween: 32,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            className="mx-auto max-w-[420px] md:max-w-[500px] lg:max-w-[720px]"
          >
            {videos.map((video, idx) => (
              <SwiperSlide key={idx}>
                <div className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-black">
                  <video
                    src={video.src}
                    poster={video.poster}
                    controls
                    preload="metadata"
                    controlsList="nodownload"
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.div>
    </section>
  );
}
