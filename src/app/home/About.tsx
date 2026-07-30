import React from "react";

import src from '@/assets/images/kisspng-quotation-mark-computer-icons-infinidat-apostrophe-5af853a2ea92a2.6656738615262237789608.png';
import { imageSrc } from '@/lib/image-src';

export default function AboutUs() {
  return (
    <div className="py-4 sm:py-8 bg-gray-50">
      <div className="container mx-auto px-0 sm:px-4 flex flex-col lg:items-center justify-between gap-8 lg:gap-10 lg:flex-row text-left">
        <div className="mb-2 xl:mb-0 w-full lg:w-1/2">
          <h1 className="text-lg sm:text-xl md:text-2xl xl:text-3xl font-semibold leading-snug text-gray-800">
            Our customers are satisfied with the services we provide
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-normal text-gray-600 max-w-xl">
            Thousands of farmers use DiFarm to monitor their agricultural
            activities and expand their yields.
          </p>
          <button
            type="button"
            className="hidden md:inline-flex mt-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 items-center justify-center px-6 py-3 bg-green-700 hover:bg-gray-600 rounded text-sm font-medium text-white"
          >
            Read success stories
          </button>
        </div>

        <div
          role="list"
          aria-label="Testimonials"
          className="w-full xl:w-1/2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4"
        >
          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6">
            <img src={imageSrc(src)} aria-hidden="true" alt="" className="h-5 w-5" />
            <div className="pl-0 sm:pl-4 pt-2 flex items-start justify-between gap-3">
              <div className="mr-2 min-w-0 flex-1">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  DiFarm yatumye nshobora gukurikirana umusaruro wanjye neza
                  kandi nkamenya uko ubutaka bwanjye buhagaze.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">
                  Kamali Jean
                </p>
              </div>
              <img
                src="https://cdn.tuk.dev/assets/components/26May-update/avatar-1.png"
                alt="Kamali Jean"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
              />
            </div>
          </div>

          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6">
            <img src={imageSrc(src)} aria-hidden="true" alt="" className="h-5 w-5" />
            <div className="pl-0 sm:pl-4 pt-2 flex items-start justify-between gap-3">
              <div className="mr-2 min-w-0 flex-1">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  Ubu ni bwo norohewe no gucunga ibyo mpinga. Serivisi za DiFarm
                  ni nziza cyane.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">
                  Mukamana Aline
                </p>
              </div>
              <img
                src="https://cdn.tuk.dev/assets/components/26May-update/avatar-2.png"
                alt="Mukamana Aline"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
              />
            </div>
          </div>

          <div role="listitem" className="bg-white shadow rounded p-4 xl:p-6 md:col-span-2 lg:col-span-1">
            <img src={imageSrc(src)} aria-hidden="true" alt="" className="h-5 w-5" />
            <div className="pl-0 sm:pl-4 pt-2 flex items-start justify-between gap-3">
              <div className="mr-2 min-w-0 flex-1">
                <p className="text-sm xl:text-base xl:leading-loose text-gray-600">
                  Gukoresha DiFarm byongereye umusaruro wanjye kandi bigabanya
                  igihombo mu buhinzi.
                </p>
                <p className="mt-2 text-sm font-semibold leading-none text-gray-800">
                  Nkurunziza Peter
                </p>
              </div>
              <img
                src="https://cdn.tuk.dev/assets/components/26May-update/avatar-3.png"
                alt="Nkurunziza Peter"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
              />
            </div>
          </div>

          <button
            type="button"
            className="md:hidden w-full mt-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 inline-flex items-center justify-center px-6 py-3 bg-green-700 hover:bg-gray-600 rounded text-sm font-medium text-white"
          >
            Soma inkuru z&apos;ubuhamya
          </button>
        </div>
      </div>
    </div>
  );
}
