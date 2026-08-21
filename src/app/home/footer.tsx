import React from "react";
import logoIcon from "@/assets/landing/logo-icon-transparent.png";
import iconFacebook from "@/assets/landing/icons/facebook.svg";
import iconTwitter from "@/assets/landing/icons/twitter.svg";
import iconInstagram from "@/assets/landing/icons/instagram.svg";
import iconGithub from "@/assets/landing/icons/github.svg";
import iconLinkedin from "@/assets/landing/icons/linkedin.svg";
import { imageSrc } from "@/lib/image-src";
import { useSafeT } from "@/hooks/useSafeT";

const socials = [
  { href: "#", label: "Facebook", icon: iconFacebook },
  { href: "#", label: "Twitter", icon: iconTwitter },
  { href: "#", label: "Instagram", icon: iconInstagram },
  { href: "#", label: "GitHub", icon: iconGithub },
  { href: "#", label: "LinkedIn", icon: iconLinkedin },
];

export default function Footer() {
  const { t } = useSafeT();

  const footerLinks = [
    { href: "#about", label: t("nav.aboutUs") },
    { href: "#services", label: t("nav.services") },
    { href: "#process", label: t("nav.ourProcess") },
    { href: "#faq", label: t("nav.faq") },
    { href: "#contact", label: t("nav.contactUs") },
  ];

  return (
    <footer className="flex w-full flex-col items-center justify-center gap-6 bg-white pb-[60px] pt-10">
      <div className="flex w-full max-w-[1282px] flex-col items-center gap-10 px-5 sm:px-8 lg:px-0">
        <div className="flex w-full flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-[529px] flex-col items-start">
            <div className="mb-3 flex items-center gap-3">
              <img
                src={imageSrc(logoIcon)}
                alt=""
                className="h-[72px] w-auto bg-transparent object-contain"
              />
              <span className="text-2xl font-semibold tracking-tight">
                <span className="text-[#08223d]">Di</span>
                <span className="text-[#376a3b]">Farm</span>
              </span>
            </div>
            <p className="text-base leading-normal text-[#3f4f58]">
              {t("home.footerBlurb")}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-[42px] gap-y-3 text-lg capitalize text-[#8896ab]">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[#08223d]">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="h-px w-full bg-[#dde4e2]" />
      </div>

      <div className="flex w-full max-w-[1282px] flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-0">
        <p className="text-base text-[#718087]">{t("home.footerRights")}</p>
        <div className="flex items-center gap-[34px]">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="inline-flex size-6"
            >
              <img src={imageSrc(social.icon)} alt="" className="size-6" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
