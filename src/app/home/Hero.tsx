import React, { useState } from "react";
import emailjs from "emailjs-com";

function Index() {
  return (
    <div className="container mx-auto my-0 max-w-6xl">
      <div className="flex flex-col lg:flex-row overflow-hidden rounded-xl shadow-lg">
        <div className="w-full lg:w-2/5 bg-green-700 py-10 sm:py-12 lg:py-16">
          <div className="px-5 sm:px-8 xl:w-5/6 xl:px-0 mx-auto text-left">
            <h1 className="text-xl sm:text-2xl pb-3 sm:pb-4 text-white font-bold">
              Get in touch
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white pb-5 sm:pb-6 leading-relaxed font-normal">
              Got a question about us? Are you interested in partnering with us?
              Have some suggestions or just want to say Hi? Just contact us. We
              are here to assist you.
            </p>
            <div className="flex pb-3 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-phone-call shrink-0"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#ffffff"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <path d="M4 4h5l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v5a1 1 0 0 1 -1 1a16 16 0 0 1 -16 -16a1 1 0 0 1 1 -1" />
                <path d="M15 7a2 2 0 0 1 2 2" />
                <path d="M15 3a6 6 0 0 1 6 6" />
              </svg>
              <p className="pl-3 sm:pl-4 text-white text-sm sm:text-base md:text-lg break-all">
                +(250) 781 120 101
              </p>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-mail shrink-0"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#FFFFFF"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <rect x={3} y={5} width={18} height={14} rx={2} />
                <polyline points="3 7 12 13 21 7" />
              </svg>
              <p className="pl-3 sm:pl-4 text-white text-sm sm:text-base md:text-lg break-all">
                Info@difarm.com
              </p>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-white pt-5 sm:pt-6 tracking-wide">
              Kigali, Rwanda
              <br />
              st-120
            </p>
          </div>
        </div>

        <div className="w-full lg:w-3/5 bg-gray-200 py-6 sm:py-8 lg:py-5 px-3 sm:px-5">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

export default Index;

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_he2kof7",
        "template_tsfpv5a",
        e.target as HTMLFormElement,
        "r7ua9HIEoc_r_6eM2"
      )
      .then(
        () => {
          alert("Email sent successfully!");
          setFormData({ name: "", email: "", message: "" });
        },
        (error) => {
          console.log("Error:", error);
          alert("Failed to send email. Please try again.");
        }
      );
  };

  return (
    <div className="bg-gray-50 p-5 sm:p-8 md:p-10 rounded-lg shadow-md max-w-lg mx-auto w-full">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">
        Contact Us
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm sm:text-md font-semibold text-gray-700 mb-1.5 sm:mb-2 text-left"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 text-sm sm:text-base"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm sm:text-md font-semibold text-gray-700 mb-1.5 sm:mb-2 text-left"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 text-sm sm:text-base"
            placeholder="Enter your email address"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm sm:text-md font-semibold text-gray-700 mb-1.5 sm:mb-2 text-left"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 text-sm sm:text-base"
            placeholder="Write your message here"
          />
        </div>
        <div className="text-center pt-1">
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none text-sm sm:text-base"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
};
