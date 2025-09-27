import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useTranslation } from "react-i18next";

import {
  bannerImgOne,
  bannerImgThree,
  bannerImgTwo,
} from "../assets/images/index";
import "slick-carousel/slick/slick.css";
import Container from "./Container";
import PriceFormat from "./PriceFormat";
import { motion } from "framer-motion";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

const Banner = () => {
  const navigate = useNavigate();
  const [dotActive, setDocActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);
  const { t } = useTranslation();
  const bannerData = [
    {
      productId: "product/68caaed0e3752565089154a0",
      title: t("banner_1.title"),
      subtitle: t("banner_1.subtitle"),
      description: t("banner_1.description"),
      discount: t("banner_1.discount"),
      from: t("banner_1.from"),
      sale: t("banner_1.sale"),
      image: bannerImgOne,
      buttonText: t("banner_1.buttonText"),
    
    },
    {
      productId: "product/68caa986e375256508915382",
      title: t("banner_2.title"),
      subtitle: t("banner_2.subtitle"),
      description: t("banner_2.description"),
      discount: t("banner_2.discount"),
      from: t("banner_2.from"),
      sale: t("banner_2.sale"),
      image: bannerImgTwo,
      buttonText: t("banner_2.buttonText"),
    },
    {
      productId: "product/68c4dc483ba8fc090f23ac2a",
      title: t("banner_3.title"),
      subtitle: t("banner_3.subtitle"),
      description: t("banner_3.description"),
      discount: t("banner_3.discount"),
      from: t("banner_3.from"),
      sale: t("banner_3.sale"),
      image: bannerImgThree,
      buttonText: t("banner_3.buttonText"),
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
    cssEase: "linear",
    beforeChange: (prev, next) => {
      setDocActive(next);
    },
    appendDots: (dots) => (
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2">
        <ul className="flex items-center gap-2 md:gap-3">{dots}</ul>
      </div>
    ),
    customPaging: (i) => (
      <div
        className={`cursor-pointer transition-all duration-300 ${i === dotActive
          ? "w-6 h-1.5 md:w-8 md:h-2 bg-gray-800 rounded-full"
          : "w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-600/50 rounded-full hover:bg-gray-600/75"
          }`}
      />
    ),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          fade: false,
        },
      },
      {
        breakpoint: 640,
        settings: {
          fade: false,
          appendDots: (dots) => (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
              <ul className="flex items-center gap-1.5">{dots}</ul>
            </div>
          ),
          customPaging: (i) => (
            <div
              className={`cursor-pointer transition-all duration-300 ${i === dotActive
                ? "w-4 h-1 bg-gray-800 rounded-full"
                : "w-1 h-1 bg-gray-600/50 rounded-full"
                }`}
            />
          ),
        },
      },
    ],
  };

  return (
    <div
      className="w-full h-auto min-h-[400px] md:h-[70vh] md:min-h-[500px] md:max-h-[700px] relative overflow-hidden group bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Slider ref={sliderRef} {...settings}>
        {bannerData?.map((item, index) => (
          <div
            key={index}
            className="relative h-auto min-h-[400px] md:h-[70vh] md:min-h-[500px] md:max-h-[700px]"
          >
            <div className="relative z-10 h-full bg-[#F3F3F3]">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10"></div>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              ></div>

              <Container className="h-full relative z-10 py-6 md:py-8 lg:py-0">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-5 h-full lg:items-center">
                  {/* Left Content */}
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-3 md:space-y-4 lg:space-y-5 text-gray-800 order-2 lg:order-1 text-center lg:text-left px-2 sm:px-0"
                  >
                    {/* Sale Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="inline-block"
                    >
                      <span className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs md:text-sm font-bold uppercase tracking-wider rounded-full shadow-lg">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                        {item?.sale}
                      </span>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight lg:leading-none bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent py-1 md:py-2"
                    >
                      {item?.title}
                    </motion.h1>
                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis max-w-full block"
                    >
                      {item?.subtitle}
                    </motion.p>
                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="text-sm sm:text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 line-clamp-1 md:line-clamp-1"
                    >
                      {item?.description}
                    </motion.p>

                    {/* Discount & Price */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-center lg:justify-start gap-3 md:gap-4 lg:gap-6 py-1 md:py-2 lg:py-4"
                    >
                      <div className="flex items-center justify-center lg:justify-start">
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text">
                          {item?.discount}
                        </div>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3">
                        <span className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">
                          {t("from.from") }{" "}
                        </span>
                        <PriceFormat
                          amount={item?.from}
                          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800"
                        />
                      </div>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="pt-1 md:pt-2 lg:pt-4 flex justify-center lg:justify-start"
                    >
                      <button
                        onClick={() => navigate("/" + item?.productId)}
                        className="group relative inline-flex items-center gap-2 md:gap-3 lg:gap-4 px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 bg-black text-white text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl rounded"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                          {item?.buttonText}
                        </span>
                        <svg
                          className="relative z-10 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 transition-all duration-300 group-hover:translate-x-2 group-hover:text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  </motion.div>

                  {/* Right Image */}
                  <motion.div
                    initial={{ opacity: 0, x: 60, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="relative order-1 lg:order-2 h-48 sm:h-64 md:h-80 lg:h-full flex items-center justify-center py-4 md:py-0"
                  >
                    <div className="relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full">
                      {/* Glowing Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl transform rotate-6"></div>

                      {/* Image Container */}
                      <div className="relative bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200/30">
                        <img
                          src={item?.image}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-auto max-h-32 sm:max-h-48 md:max-h-64 lg:max-h-[450px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Floating Elements */}
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 lg:-top-4 lg:-right-4 w-8 h-8 md:w-12 md:h-12 lg:w-20 lg:h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-10 animate-pulse"></div>
                      <div className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 lg:-bottom-6 lg:-left-6 w-6 h-6 md:w-10 md:h-10 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
                    </div>
                  </motion.div>
                </div>
              </Container>
            </div>
          </div>
        ))}
      </Slider>

      {/* Navigation Arrows - Hide on mobile */}
      <div
        className={`hidden md:flex absolute inset-y-0 left-0 items-center z-20 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}
      >
        <button
          onClick={() => sliderRef.current?.slickPrev()}
          className="ml-4 p-2 md:p-3 bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-900 transition-all duration-200 rounded-full group shadow-lg"
          aria-label="Previous slide"
        >
          <HiChevronLeft className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </div>

      <div
        className={`hidden md:flex absolute inset-y-0 right-0 items-center z-20 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}
      >
        <button
          onClick={() => sliderRef.current?.slickNext()}
          className="mr-4 p-2 md:p-3 bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-900 transition-all duration-200 rounded-full group shadow-lg"
          aria-label="Next slide"
        >
          <HiChevronRight className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </div>
    </div>
  );
};

export default Banner;