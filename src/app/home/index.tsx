import Navbar from "@/app/home/Nav";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import heroImage from "@/assets/images/cows-green-field-blue-sky.jpg";
import marketingIcon from "@/assets/images/Market.png";
import cattleManagementIcon from "@/assets/images/istockphoto-2148142112-2048x2048.jpg";
import productionManagementIcon from "@/assets/images/10181745.jpg";
import stockManagementIcon from "@/assets/images/395.jpg";
import cattleHealthIcon from "@/assets/images/Healthcare.png";
import AboutUs from "./About";
import ServicesCard from "./Service";
import Index from "./Hero";
import Footer from "./footer";
import { imageSrc } from "@/lib/image-src";

const previewServices = [
  {
    icon: cattleManagementIcon,
    title: "Cattle Management",
    description: "Track your cattle growth, health, and productivity.",
  },
  {
    icon: marketingIcon,
    title: "Marketing Production",
    description: "Boost your sales with our comprehensive marketing tools.",
  },
  {
    icon: productionManagementIcon,
    title: "Production Management",
    description: "Optimize your production cycle and maximize your output.",
  },
];

const allServices = [
  ...previewServices,
  {
    icon: stockManagementIcon,
    title: "Stock Management",
    description: "Manage your inventory with ease.",
  },
  {
    icon: cattleHealthIcon,
    title: "Cattle Health",
    description: "Monitor the health and wellness of your livestock.",
  },
];

function Home() {
  return (
    <div className="scrollbar-hidden font-outfit overflow-x-hidden">
      <Navbar />

      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <section
          className="relative flex items-center justify-center min-h-[70vh] sm:min-h-[75vh] md:h-[90vh]"
          style={{
            backgroundImage: `url(${imageSrc(heroImage)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/30" />

          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full max-w-4xl mx-auto text-white px-4 sm:px-6 md:px-8 text-center py-16 sm:py-20"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 leading-tight text-green-500">
              DI FARM
            </h1>
            <p className="text-base sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed text-white/95">
              Manage your farm efficiently with our powerful tools and analytics,
              designed to maximize productivity and minimize effort.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center font-bold bg-green-500 text-white px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full hover:bg-green-600 transition-all duration-300 shadow-lg text-sm sm:text-base"
            >
              Get Started
              <FiArrowRight className="ml-2" size={20} />
            </a>
          </motion.div>
        </section>

        {/* Preview cards — flow layout (no absolute overflow on mobile) */}
        <section className="relative z-20 px-4 sm:px-6 -mt-10 sm:-mt-14 md:-mt-20 pb-6 sm:pb-8">
          <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl">
            {previewServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.12 }}
                className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl flex flex-col items-center text-center w-full"
              >
                <div className="bg-green-100 p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                  <img
                    src={imageSrc(service.icon)}
                    alt={service.title}
                    className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 object-cover rounded-full"
                  />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-green-600 mb-2 sm:mb-4">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 bg-gray-100">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-green-600">
              Our Services
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-1">
              Our services are tailored to help you manage every aspect of your
              farm, from cattle health to marketing and stock management.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {allServices.map((service) => (
                <ServicesCard
                  key={service.title}
                  title={service.title}
                  description={service.description}
                  image={imageSrc(service.icon)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Customer journey */}
        <section id="about-us" className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="mx-auto px-4 sm:px-6 md:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-green-600">
              Customer Journey
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12">
              What our customers are saying about us
            </p>
            <AboutUs />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-12 sm:py-16 md:py-20 bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
              Contact Us
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12 mt-3">
              Have any questions? Get in touch with us through any of the
              platforms below.
            </p>
            <Index />
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default Home;
