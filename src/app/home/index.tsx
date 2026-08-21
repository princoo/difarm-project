import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { imageSrc } from "@/lib/image-src";
import { useSafeT } from "@/hooks/useSafeT";
import Navbar from "@/app/home/Nav";
import ContactSection from "./Hero";
import Footer from "./footer";

import heroImage from "@/assets/landing/hero-cow.png";
import aboutImage from "@/assets/landing/about-cows.png";
import servicesImage from "@/assets/landing/services-cows.png";
import processImage from "@/assets/landing/process-digital.png";
import productionShowcase from "@/assets/landing/showcase-production.png";
import usersShowcase from "@/assets/landing/showcase-users.png";

import iconSparkle from "@/assets/landing/icons/sparkle.svg";
import iconChip from "@/assets/landing/icons/chip.svg";
import iconLivestock from "@/assets/landing/icons/livestock.svg";
import iconHealth from "@/assets/landing/icons/health.svg";
import iconLocation from "@/assets/landing/icons/location.svg";
import iconInsights from "@/assets/landing/icons/insights.svg";
import iconCheck from "@/assets/landing/icons/check.svg";
import iconChevron from "@/assets/landing/icons/chevron.svg";

function Accent({
  label,
  dark = false,
}: {
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center gap-[5px] rounded-[40px] py-[5px] pl-2 pr-3.5 ${
        dark ? "bg-[#08223d]" : "bg-[#376a3b]"
      }`}
    >
      <img src={imageSrc(iconSparkle)} alt="" className="size-6" />
      <span className="text-sm font-medium tracking-[0.7px] text-white whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex w-full items-start gap-2.5">
      <img src={imageSrc(iconCheck)} alt="" className="size-6 shrink-0" />
      <p className="flex-1 text-base leading-normal text-[#08223d]">{text}</p>
    </div>
  );
}

function SolutionCard({
  icon,
  title,
  desc,
}: {
  icon: string | { src: string };
  title: string;
  desc: string;
}) {
  return (
    <div className="flex w-full flex-col items-start overflow-clip rounded-[14px] border border-solid border-[#dde4e2] bg-white px-5 pb-5 pt-6 sm:px-8 sm:pb-[26px] sm:pt-[30px]">
      <div className="flex w-full flex-col gap-4">
        <div className="inline-flex w-fit items-center justify-center rounded-[60px] bg-[#eaf3ea] p-2.5">
          <div className="relative size-10 overflow-clip">
            <img
              src={imageSrc(icon)}
              alt=""
              className="absolute inset-0 size-full object-contain"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 leading-normal">
          <p className="font-outfit text-[22px] font-medium capitalize text-[#08223d]">
            {title}
          </p>
          <p className="text-base text-[#718087]">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { t } = useSafeT();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    {
      value: t("home.statFarmsValue"),
      label: t("home.statFarmsLabel"),
      desc: t("home.statFarmsDesc"),
    },
    {
      value: t("home.statSoftwareValue"),
      label: t("home.statSoftwareLabel"),
      desc: t("home.statSoftwareDesc"),
    },
    {
      value: t("home.statDistrictsValue"),
      label: t("home.statDistrictsLabel"),
      desc: t("home.statDistrictsDesc"),
    },
  ];

  const aboutChips = [
    t("home.chipLocation"),
    t("home.chipRecords"),
    t("home.chipHealth"),
    t("home.chipPerformance"),
  ];

  const solutions = [
    {
      icon: iconLivestock,
      title: t("home.solutionLivestock"),
      desc: t("home.solutionLivestockDesc"),
    },
    {
      icon: iconHealth,
      title: t("home.solutionHealth"),
      desc: t("home.solutionHealthDesc"),
    },
    {
      icon: iconLocation,
      title: t("home.solutionTracking"),
      desc: t("home.solutionTrackingDesc"),
    },
    {
      icon: iconInsights,
      title: t("home.solutionInsights"),
      desc: t("home.solutionInsightsDesc"),
    },
  ];

  const processSteps = [
    {
      num: "01",
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
    },
    {
      num: "02",
      title: t("home.step2Title"),
      desc: t("home.step2Desc"),
    },
    {
      num: "03",
      title: t("home.step3Title"),
      desc: t("home.step3Desc"),
    },
    {
      num: "04",
      title: t("home.step4Title"),
      desc: t("home.step4Desc"),
    },
  ];

  const dashboardFeatures = [
    t("home.dashFeature1"),
    t("home.dashFeature2"),
    t("home.dashFeature3"),
    t("home.dashFeature4"),
    t("home.dashFeature5"),
    t("home.dashFeature6"),
    t("home.dashFeature7"),
    t("home.dashFeature8"),
  ];

  const collarFeatures = [
    t("home.collarFeature1"),
    t("home.collarFeature2"),
    t("home.collarFeature3"),
    t("home.collarFeature4"),
    t("home.collarFeature5"),
    t("home.collarFeature6"),
    t("home.collarFeature7"),
  ];

  const faqItems = [
    { q: t("home.faqQ1"), a: t("home.faqA1") },
    { q: t("home.faqQ2"), a: t("home.faqA2") },
    { q: t("home.faqQ3"), a: t("home.faqA3") },
    { q: t("home.faqQ4"), a: t("home.faqA4") },
    { q: t("home.faqQ5"), a: t("home.faqA5") },
    { q: t("home.faqQ6"), a: t("home.faqA6") },
  ];

  return (
    <div className="relative flex w-full flex-col items-start overflow-x-hidden bg-[#f5f7f6] font-outfit">
      <Navbar />

      <section
        id="home"
        className="relative flex w-full min-h-[100svh] flex-col justify-end overflow-hidden sm:min-h-[700px] sm:justify-center lg:min-h-[760px]"
      >
        <img
          alt=""
          src={imageSrc(heroImage)}
          className="pointer-events-none absolute inset-0 size-full max-w-none object-cover object-[70%_center] sm:object-center"
        />
        {/* Soft overlays so headline + CTAs stay readable and nothing clips */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-[#eaf3ea]/85 sm:from-white/30 sm:via-transparent sm:to-[#eaf3ea]/70" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/70 via-white/35 to-transparent sm:max-w-[720px] lg:from-white/50" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-start px-5 pb-10 pt-[7.5rem] sm:px-10 sm:pb-16 sm:pt-36 lg:px-20 lg:pb-24 lg:pt-40">
          <div className="flex w-full max-w-[690px] flex-col items-start gap-6 sm:gap-[30px]">
            <div className="flex w-full flex-col items-start gap-3 sm:gap-4">
              <h1 className="w-full text-[1.75rem] font-semibold capitalize leading-snug text-[#08223d] sm:text-5xl sm:leading-normal lg:text-[52px]">
                {t("home.heroTitleLine1")}
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                {t("home.heroTitleLine2")}
              </h1>
              <p className="w-full max-w-[36rem] text-sm leading-relaxed text-[#3f4f58] sm:text-base sm:leading-normal">
                {t("home.heroSubtitle")}
              </p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
              <a
                href="#contact"
                className="flex w-full items-center justify-center rounded-[40px] bg-[#08223d] px-6 py-3.5 text-[15px] font-medium text-white sm:w-auto sm:py-3"
              >
                {t("home.requestAppointment")}
              </a>
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-[40px] border border-solid border-[#376a3b] bg-white/80 px-6 py-3.5 text-[15px] font-medium text-[#376a3b] backdrop-blur-sm sm:w-auto sm:bg-transparent sm:py-3 sm:backdrop-blur-none"
              >
                {t("home.registerFarm")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="flex w-full shrink-0 flex-col items-center bg-[#eaf3ea] px-5 py-10 sm:px-10 sm:py-[50px] lg:px-20">
        <div className="flex w-full max-w-[1280px] flex-col items-start justify-between gap-8 sm:gap-10 lg:flex-row lg:items-center">
          <h2 className="shrink-0 max-w-none text-[24px] font-medium capitalize leading-snug text-[#08223d] sm:max-w-[200px] sm:text-[28px] sm:leading-normal">
            {t("home.statsTitle")}
          </h2>
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-[31px] lg:w-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="flex w-full flex-col gap-2.5 leading-normal sm:gap-3.5 sm:w-[267px]">
                <div className="flex flex-col gap-[5px] capitalize text-[#08223d]">
                  <p className="text-[28px] font-semibold sm:text-[32px]">{stat.value}</p>
                  <p className="text-lg font-medium sm:text-[22px]">{stat.label}</p>
                </div>
                <p className="text-sm text-[#3f4f58]">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="flex w-full shrink-0 flex-col items-center bg-white px-5 py-[60px] sm:px-10 lg:px-20"
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="relative w-full shrink-0 lg:w-[min(653px,48%)]">
            <div className="relative aspect-[653/400] w-full overflow-hidden rounded-[30px] sm:aspect-[653/435]">
              <img
                alt=""
                src={imageSrc(aboutImage)}
                className="absolute inset-0 size-full rounded-[30px] object-cover"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {aboutChips.map((chip) => (
                <div
                  key={chip}
                  className="inline-flex items-center gap-[9px] rounded-[130px] bg-[#08223d] py-[5px] pl-2.5 pr-[17px]"
                >
                  <img src={imageSrc(iconChip)} alt="" className="size-[19px]" />
                  <p className="text-sm font-semibold leading-[22px] text-[#f5f7f6]">
                    {chip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-start justify-center gap-4 lg:flex-1">
            <Accent label={t("home.aboutBadge")} />
            <p className="text-[28px] font-medium capitalize leading-tight text-[#08223d] sm:text-[38px] sm:leading-[50px]">
              {t("home.aboutTitle")}
            </p>
            <div className="space-y-4 text-base leading-normal text-[#3f4f58]">
              <p>{t("home.aboutP1")}</p>
              <p>{t("home.aboutP2")}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="flex w-full shrink-0 flex-col items-center justify-center gap-10 px-2.5 py-[60px]"
      >
        <div className="flex w-full max-w-[680px] flex-col items-center gap-5 text-center">
          <Accent label={t("home.solutionsBadge")} />
          <p className="text-[28px] font-medium capitalize leading-snug text-[#08223d] sm:text-[38px] sm:leading-[50px]">
            {t("home.solutionsTitle")}
          </p>
        </div>

        <div className="flex w-full max-w-[1285px] flex-col items-stretch gap-5 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-5">
            {solutions.slice(0, 2).map((item) => (
              <SolutionCard key={item.title} {...item} />
            ))}
          </div>

          <div className="relative hidden h-auto min-h-[520px] w-[402px] shrink-0 overflow-hidden rounded-[14px] lg:block">
            <img
              alt=""
              src={imageSrc(servicesImage)}
              className="absolute inset-0 size-full max-w-none rounded-[14px] object-cover"
            />
            <div className="absolute inset-0 rounded-[14px] bg-black/15" />
          </div>

          <div className="flex flex-1 flex-col gap-5">
            {solutions.slice(2).map((item) => (
              <SolutionCard key={item.title} {...item} />
            ))}
          </div>

          <div className="relative h-[260px] w-full overflow-hidden rounded-[14px] sm:h-[320px] lg:hidden">
            <img
              alt=""
              src={imageSrc(servicesImage)}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
          </div>
        </div>
      </section>

      <section
        id="process"
        className="flex w-full shrink-0 flex-col items-center bg-[#376a3b] px-5 py-[60px] sm:px-10 lg:px-20"
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex w-full max-w-[548px] flex-col items-start justify-center gap-5 lg:w-[min(548px,42%)] lg:shrink-0">
            <div className="flex w-full flex-col items-start gap-4">
              <Accent label={t("home.processBadge")} dark />
              <div className="flex w-full flex-col items-start gap-[5px]">
                <p className="w-full text-[28px] font-medium capitalize leading-snug text-white sm:text-[38px] sm:leading-[50px]">
                  {t("home.processTitle")}
                </p>
                <p className="w-full text-base leading-normal text-white">
                  {t("home.processIntro")}
                </p>
              </div>
            </div>
            <div className="relative aspect-[1024/819] w-full overflow-hidden rounded-xl bg-[#2f5a33]">
              <img
                alt=""
                src={imageSrc(processImage)}
                className="absolute inset-0 size-full rounded-xl object-contain object-center"
              />
            </div>
          </div>

          <div className="flex w-full flex-1 flex-col items-stretch justify-center gap-5 leading-normal lg:max-w-[652px]">
            {processSteps.map((step) => (
              <div
                key={step.num}
                className="flex w-full shrink-0 flex-col items-start gap-3 rounded-xl bg-[#4d8251] px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-[30px]"
              >
                <div className="flex w-full shrink-0 flex-col items-start gap-[5px] sm:w-[200px]">
                  <p className="w-full text-xl font-semibold text-[#d99b35]">
                    {step.num}
                  </p>
                  <p className="w-full text-lg font-medium capitalize text-white">
                    {step.title}
                  </p>
                </div>
                <p className="min-w-0 flex-1 text-base text-[#cacaca]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex w-full shrink-0 flex-col items-start bg-white px-5 py-[60px] sm:px-10 lg:px-20">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 lg:flex-row lg:gap-24">
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex w-full flex-col items-start gap-2.5">
                <Accent label={t("home.dashboardBadge")} />
                <p className="text-[28px] font-medium capitalize leading-tight text-[#08223d] sm:text-[38px] sm:leading-[50px]">
                  {t("home.dashboardTitle")}
                </p>
                <p className="text-base leading-normal text-[#3f4f58]">
                  {t("home.dashboardIntro")}
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-1.5">
                {dashboardFeatures.map((feature) => (
                  <CheckItem key={feature} text={feature} />
                ))}
              </div>
            </div>
          </div>
          <div className="relative h-[280px] w-full shrink-0 overflow-hidden rounded-xl sm:h-[400px] lg:h-[440px] lg:w-[647px]">
            <div className="absolute inset-0 rounded-xl bg-[#efeeee]" />
            <img
              alt=""
              src={imageSrc(productionShowcase)}
              className="absolute inset-0 size-full max-w-none rounded-xl object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/10" />
          </div>
        </div>
      </section>

      <section className="flex w-full shrink-0 flex-col items-start bg-white px-5 pb-[60px] sm:px-10 lg:px-20">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col-reverse items-center gap-12 lg:flex-row lg:gap-24">
          <div className="relative h-[280px] w-full shrink-0 overflow-hidden rounded-xl sm:h-[400px] lg:h-[440px] lg:w-[647px]">
            <div className="absolute inset-0 rounded-xl bg-[#efeeee]" />
            <img
              alt=""
              src={imageSrc(usersShowcase)}
              className="absolute inset-0 size-full max-w-none rounded-xl object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/10" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex w-full flex-col items-start gap-2.5">
                <Accent label={t("home.collarBadge")} />
                <p className="text-[28px] font-medium capitalize leading-tight text-[#08223d] sm:text-[38px] sm:leading-[50px]">
                  {t("home.collarTitle")}
                </p>
                <p className="text-base leading-normal text-[#3f4f58]">
                  {t("home.collarIntro")}
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-1.5">
                {collarFeatures.map((feature) => (
                  <CheckItem key={feature} text={feature} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="flex w-full shrink-0 flex-col items-center px-5 py-[60px] sm:px-10 lg:px-[100px]"
      >
        <div className="flex w-full max-w-[1054px] flex-col items-center gap-[60px]">
          <div className="flex w-full max-w-[680px] flex-col items-center gap-5 text-center">
            <Accent label={t("home.faqBadge")} />
            <p className="text-[28px] font-medium capitalize leading-snug text-[#08223d] sm:text-[38px] sm:leading-[50px]">
              {t("home.faqTitle")}
            </p>
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            {faqItems.map((item, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full flex-col rounded-[20px] bg-white px-5 py-2.5 text-left"
                  aria-expanded={open}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="min-w-0 flex-1 p-2.5 text-lg leading-normal text-[#08223d]">
                      {item.q}
                    </p>
                    <img
                      src={imageSrc(iconChevron)}
                      alt=""
                      className={`size-6 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {open && (
                    <p className="px-2.5 pb-3 text-base leading-normal text-[#3f4f58]">
                      {item.a}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="flex w-full shrink-0 flex-col items-center bg-white px-5 pt-[60px] sm:px-10 lg:px-20"
      >
        <div className="w-full max-w-[1280px]">
          <ContactSection />
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
