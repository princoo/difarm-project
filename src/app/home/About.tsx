import React from "react";

import src from '@/assets/images/kisspng-quotation-mark-computer-icons-infinidat-apostrophe-5af853a2ea92a2.6656738615262237789608.png';
import { imageSrc } from '@/lib/image-src';

export default function AboutUs() {
  return (
    <div className="py-10 bg-gray-50">
      <div className="container mx-auto px-4 flex flex-col lg:items-center justify-between lg:flex-row">
        {/* Text Section */}
        <div className="mb-10 xl:mb-0">
  <h1 className="text-lg leading-tight md:text-2xl xl:text-3xl font-semibold leading-7 text-gray-800 xl:w-2/3 pr-16 lg:pr-0">
    Our customers are satisfied with the services we provide
  </h1>
  <p className="mt-2 text-sm leading-normal text-gray-600 md:w-2/3 lg:w-3/4 pr-16 lg:pr-0">
    Thousands of farmers use DiFarm to monitor their agricultural activities and expand their yields.
  </p>
  <button className="hidden md:block w-full sm:w-auto mt-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 flex items-start justify-center sm:justify-start px-6 py-3 bg-green-700 hover:bg-gray-600 rounded text-sm font-medium leading-none text-center text-white">
    Read success stories
  </button>
</div>


        {/* Testimonials Section */}
        <div role="list" aria-label="Testimonials" className="xl:w-1/2 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 flex-wrap justify-center items-start">
          {/* Testimonial 1 */}
          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6">
            <img src={imageSrc(src)} aria-hidden="true" className="h-5 w-5" />
            <div className="pl-4 pt-2 flex items-start justify-between">
              <div className="mr-4">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  DiFarm yatumye nshobora gukurikirana umusaruro wanjye neza kandi nkamenya uko ubutaka bwanjye buhagaze.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">Kamali Jean</p>
              </div>
              <img src="https://cdn.tuk.dev/assets/components/26May-update/avatar-1.png" alt="Display Avatar of Kamali Jean" role="img" />
            </div>
          </div>

          {/* Testimonial 2 */}
          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6">
            <img src={imageSrc(src)} aria-hidden="true" className="h-5 w-5" />
            <div className="pl-4 pt-2 flex items-start justify-between">
              <div className="mr-4">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  Ubu ni bwo norohewe no gucunga ibyo mpinga. Serivisi za DiFarm ni nziza cyane.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">Mukamana Aline</p>
              </div>
              <img src="https://cdn.tuk.dev/assets/components/26May-update/avatar-2.png" alt="Display avatar of Mukamana Aline" role="img" />
            </div>
          </div>

          {/* Testimonial 3 */}
          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6">
            <img src={imageSrc(src)} aria-hidden="true" className="h-5 w-5" />
            <div className="pl-4 pt-2 flex items-start justify-between">
              <div className="mr-4">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  Gukoresha DiFarm byongereye umusaruro wanjye kandi bigabanya igihombo mu buhinzi.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">Nkurunziza Peter</p>
              </div>
              <img src="https://cdn.tuk.dev/assets/components/26May-update/avatar-3.png" alt="Display Avatar of Nkurunziza Peter" role="img" />
            </div>
          </div>

          {/* Mobile Button */}
          <button className="md:hidden w-full sm:w-auto mt-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 flex items-start justify-center sm:justify-start px-6 py-3 bg-green-700 hover:bg-gray-600 rounded text-sm font-medium leading-none text-center text-white">
            Soma inkuru z&apos;ubuhamya
          </button>
        </div>
      </div>
    </div>
  );
}
