import React from "react";

interface ServicesCardProps {
  title: string;
  image: string;
  description: string;
}

const ServicesCard: React.FC<ServicesCardProps> = ({
  title,
  image,
  description,
}) => {
  return (
    <div className="flex flex-col h-full p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out w-full min-w-0">
      <img
        src={image}
        alt={title}
        className="w-full h-40 sm:h-44 md:h-48 object-cover rounded-lg"
      />
      <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 text-gray-800 text-start mt-3">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 text-start flex-1">
        {description}
      </p>
      <div className="flex justify-start mt-4">
        <button
          type="button"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default ServicesCard;
