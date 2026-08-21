import React, { useState } from "react";
import emailjs from "emailjs-com";
import { imageSrc } from "@/lib/image-src";
import iconSparkle from "@/assets/landing/icons/sparkle.svg";
import iconPhone from "@/assets/landing/icons/phone.svg";
import iconEmail from "@/assets/landing/icons/email.svg";
import iconMap from "@/assets/landing/icons/map.svg";
import { useSafeT } from "@/hooks/useSafeT";

export default function ContactSection() {
  const { t } = useSafeT();

  return (
    <div className="flex w-full flex-col items-start justify-between gap-10 lg:flex-row">
      <div className="flex w-full max-w-[537px] flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center justify-center gap-1.5 rounded-[40px] bg-[#376a3b] py-[5px] pl-2 pr-3.5">
            <img src={imageSrc(iconSparkle)} alt="" className="size-6" />
            <span className="text-sm font-medium tracking-[0.7px] text-white">
              {t("home.contactBadge")}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <h2 className="font-outfit text-[28px] font-medium capitalize leading-tight text-[#08223d] sm:text-[38px] sm:leading-[50px]">
              {t("home.contactTitle")}
            </h2>
            <p className="text-base leading-normal text-[#3f4f58]">
              {t("home.contactIntro")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <img src={imageSrc(iconPhone)} alt="" className="size-6 shrink-0" />
            <p className="text-base text-[#3f4f58]">{t("home.contactPhone")}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <img src={imageSrc(iconEmail)} alt="" className="size-6 shrink-0" />
            <p className="text-base text-[#3f4f58]">{t("home.contactEmail")}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <img src={imageSrc(iconMap)} alt="" className="size-6 shrink-0" />
            <p className="text-base text-[#3f4f58]">{t("home.contactAddress")}</p>
          </div>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}

const fieldBase =
  "block w-full appearance-none rounded-lg border border-[#dde4e2] bg-white px-5 py-3 text-sm text-[#08223d] shadow-none outline-none ring-0 focus:border-[#376a3b] focus:outline-none focus:ring-0";

const ContactForm = () => {
  const { t } = useSafeT();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    emailjs
      .sendForm(
        "service_he2kof7",
        "template_tsfpv5a",
        e.target as HTMLFormElement,
        "r7ua9HIEoc_r_6eM2"
      )
      .then(
        () => {
          setStatus("sent");
          setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          });
        },
        () => setStatus("error")
      );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[629px] flex-col gap-5"
    >
      <div className="relative h-[50px] w-full">
        <input
          type="text"
          name="name"
          id="contact-name"
          value={formData.name}
          onChange={handleChange}
          required
          aria-label={t("common.name")}
          className={`${fieldBase} absolute inset-0 h-[50px] placeholder:text-transparent`}
          placeholder={t("common.name")}
        />
        {!formData.name && (
          <label
            htmlFor="contact-name"
            className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-sm text-[#718087]"
          >
            {t("common.name")} <span className="text-[#eb5757]">*</span>
          </label>
        )}
      </div>

      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder={t("common.email")}
        className={`${fieldBase} h-[50px] placeholder:text-[#718087]`}
      />

      <div className="relative h-[50px] w-full">
        <input
          type="tel"
          name="phone"
          id="contact-phone"
          value={formData.phone}
          onChange={handleChange}
          required
          aria-label={t("common.phone")}
          className={`${fieldBase} absolute inset-0 h-[50px] placeholder:text-transparent`}
          placeholder={t("common.phone")}
        />
        {!formData.phone && (
          <label
            htmlFor="contact-phone"
            className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-sm text-[#718087]"
          >
            {t("common.phone")} <span className="text-[#eb5757]">*</span>
          </label>
        )}
      </div>

      <div className="relative h-[50px] w-full">
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={`${fieldBase} h-[50px] pr-10 text-black`}
        >
          <option value="">{t("common.subject")}</option>
          <option value="Book Appointment">{t("home.subjectAppointment")}</option>
          <option value="Register Your farm">{t("home.subjectRegister")}</option>
          <option value="Partnership">{t("home.subjectPartnership")}</option>
          <option value="Support">{t("home.subjectSupport")}</option>
        </select>
        <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-[#718087]">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>

      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        required
        placeholder={t("common.message")}
        className={`${fieldBase} h-[135px] resize-none placeholder:text-[#718087]`}
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-auto w-[203px] items-center justify-center rounded-[40px] bg-[#08223d] px-6 py-4 text-[15px] font-medium text-white disabled:opacity-70"
      >
        {status === "sending" ? t("common.sending") : t("common.submit")}
      </button>

      {status === "sent" && (
        <p className="text-sm text-[#376a3b]">{t("common.sentSuccess")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{t("common.sentError")}</p>
      )}
    </form>
  );
};
