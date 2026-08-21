import React, { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { Link } from "@/lib/router-compat";
import logoIcon from "@/assets/landing/logo-icon-transparent.png";
import { imageSrc } from "@/lib/image-src";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useSafeT } from "@/hooks/useSafeT";

const Navbar: React.FC = () => {
  const { t } = useSafeT();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { href: "#home", label: t("nav.home") },
    { href: "#about", label: t("nav.aboutUs") },
    { href: "#services", label: t("nav.services") },
    { href: "#faq", label: t("nav.faq") },
    { href: "#contact", label: t("nav.contact") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 pb-4 pt-5 sm:px-10 lg:px-20">
        <a
          href="#home"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="DiFarm"
        >
          <img
            src={imageSrc(logoIcon)}
            alt=""
            className="h-11 w-auto bg-transparent object-contain sm:h-[51px]"
          />
          <span
            className={`text-xl font-semibold tracking-tight sm:text-2xl ${
              scrolled ? "text-[#08223d]" : "text-white"
            }`}
          >
            <span className={scrolled ? "text-[#08223d]" : "text-white"}>Di</span>
            <span className={scrolled ? "text-[#376a3b]" : "text-[#9fd4a3]"}>Farm</span>
          </span>
        </a>

        <div className="hidden items-center gap-[60px] lg:flex">
          <div className="flex items-center gap-3.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`p-2.5 text-base font-medium whitespace-nowrap ${
                  scrolled ? "text-[#08223d]" : "text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <Link
              to="/login"
              className={`flex items-center justify-center rounded-[40px] border border-solid px-6 py-3 text-[15px] font-medium ${
                scrolled
                  ? "border-[#08223d] text-[#08223d]"
                  : "border-white text-white"
              }`}
            >
              {t("nav.signIn")}
            </Link>
            <a
              href="#contact"
              className="flex items-center justify-center rounded-[40px] bg-[#08223d] px-6 py-3 text-[15px] font-medium text-white"
            >
              {t("nav.bookAppointment")}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={`rounded-md p-2 ${scrolled ? "text-[#08223d]" : "text-white"}`}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[#dde4e2] bg-white lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-[#08223d]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-[#08223d]"
            >
              {t("nav.signIn")}
            </Link>
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="mt-2 block rounded-[40px] bg-[#08223d] px-4 py-3 text-center text-[15px] font-medium text-white"
            >
              {t("nav.bookAppointment")}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
