import React, { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "@/lib/router-compat";
import Logo from "@/assets/logo.png";
import { imageSrc } from "@/lib/image-src";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left - Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <img src={imageSrc(Logo)} alt="DiFarm" className="h-10 w-auto" />
            <span className="text-2xl font-bold">
              <span className="text-green-500">DI</span>
              <span className="text-gray-800">FARM</span>
            </span>
          </div>

          {/* Center - Menu for larger screens */}
          {/* <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/home"
              className="text-sm text-gray-600 hover:text-green-500 transition duration-200"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-sm text-gray-600 hover:text-green-500 transition duration-200"
            >
              About
            </Link>
            <Link
              to="/services"
              className="text-sm text-gray-600 hover:text-green-500 transition duration-200"
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="text-sm text-gray-600 hover:text-green-500 transition duration-200"
            >
              Contact
            </Link>
          </div> */}

          {/* Right - Get Started Button */}
          <div className="flex space-x-4 items-center">
            <Link
              to="/login"
              className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition duration-200"
            >
              Get Started
              <FiArrowRight className="ml-2" size={20} />
            </Link>
          </div>

          {/* Hamburger Menu for Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-600 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-4 pb-4 space-y-2">
            {/* <a
              href="/"
              className="block text-sm text-gray-700 hover:text-green-500 transition duration-200"
            >
              Home
            </a>
            <a
              href="/about"
              className="block text-sm text-gray-700 hover:text-green-500 transition duration-200"
            >
              About
            </a>
            <a
              href="/services"
              className="block text-sm text-gray-700 hover:text-green-500 transition duration-200"
            >
              Services
            </a>
            <a
              href="/contact"
              className="block text-sm text-gray-700 hover:text-green-500 transition duration-200"
            >
              Contact
            </a> */}
            <Link
              to="/login"
              className="block text-sm text-gray-700 hover:text-green-500 transition duration-200"
            >
              Login
            </Link>
            {/* <a
              href="/signup"
              className="block bg-green-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Sign Up
            </a> */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
