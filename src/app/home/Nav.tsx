import React, { useState } from "react";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import { Link } from "@/lib/router-compat";
import Logo from "@/assets/logo.png";
import { imageSrc } from "@/lib/image-src";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
          <Link to="/home" className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img
              src={imageSrc(Logo)}
              alt="DiFarm"
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-lg sm:text-2xl font-bold truncate">
              <span className="text-green-500">DI</span>
              <span className="text-gray-800">FARM</span>
            </span>
          </Link>

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center">
            <Link
              to="/login"
              className="inline-flex items-center bg-green-500 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full hover:bg-green-600 transition duration-200 text-sm md:text-base"
            >
              Get Started
              <FiArrowRight className="ml-2" size={18} />
            </Link>
          </div>

          {/* Mobile: compact CTA + menu */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            <a
              href="#services"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              Services
            </a>
            <a
              href="#about-us"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              Customer Journey
            </a>
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600"
            >
              Contact
            </a>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
