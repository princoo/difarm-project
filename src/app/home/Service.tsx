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
    <div className="flex flex-col p-4 md:p-6 lg:p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out min-w-[300px]">
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <h3 className="text-lg font-bold mb-2 text-gray-800 text-start ">{title}</h3>
      <p className="text-gray-600 text-start mt-2">{description}</p>
      <div className="flex justify-start mt-4">
        <button className="bg-green-500 hover:bg-green-700 x text-white font-bold py-2 px-4 rounded">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default ServicesCard;
