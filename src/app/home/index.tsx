import Navbar from "@/app/home/Nav";
import { motion } from "framer-motion";
import {
  FiArrowRight,
} from "react-icons/fi";
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

function Home() {
  return (
    <div className="scrollbar-hidden font-outfit">
      <Navbar />

      {/* Main Content Container */}
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <section
          className="relative flex items-center justify-center h-[80vh] md:h-[90vh]"
          style={{
            backgroundImage: `url(${imageSrc(heroImage)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent"></div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 container mx-auto text-white px-4 md:px-8 lg:px-12 text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight text-green-500">
              DI FARM
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl mb-8 max-w-4xl mx-auto">
              Manage your farm efficiently with our powerful tools and analytics, designed to maximize productivity and minimize effort.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center font-bold bg-green-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-full hover:bg-green-600 transition-all duration-300 shadow-lg transform hover:scale-110"
            >
              Get Started
              <FiArrowRight className="ml-2" size={24} />
            </a>
          </motion.div>

          {/* Service Previews */}
          <div className="absolute bottom-[-150px] w-full flex justify-center space-x-4 md:space-x-8 lg:space-x-12 px-4">
            {[
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
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-2xl transform transition duration-300 hover:shadow-lg hover:scale-105 flex flex-col items-center text-center"
                style={{ minWidth: "280px", maxWidth: "300px" }}
              >
                <div className="bg-green-100 p-4 rounded-full mb-6">
                  <img src={imageSrc(service.icon)} alt={service.title} className="h-20 w-20" />
                </div>
                <h3 className="text-2xl font-semibold text-green-600 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-700">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 px-10 bg-gray-100 mt-64">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-green-600">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
              Our services are tailored to help you manage every aspect of your farm, from cattle health to marketing and stock management.
            </p>
            <div className="flex overflow-x-scroll space-x-6 px-4 scrollbar-hidden py-4">
              {[
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
              ].map((service, index) => (
                <ServicesCard key={index} title={service.title} description={service.description} image={imageSrc(service.icon)} />
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about-us" className="py-20 bg-gray-50">
          <div className="mx-auto px-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-green-600">
              Customer Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              What our customers are saying about us
            </p>
            <AboutUs />
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold  text-green-600">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              Have any questions? Get in touch with us through any of the platforms below.
            </p>
            <Index />
          </div>
        </section>
        <section>
        <Footer/>
        </section>
        
      </div>
    </div>
  );
}

export default Home;
