import React from 'react';
import IconTrash from '../Icon/IconTrash';
import Tippy from '@tippyjs/react';
import { RiDownloadLine } from 'react-icons/ri';
import { BsThreeDots } from 'react-icons/bs';
import IconSearch from '../Icon/IconSearch';
import IconXCircle from '../Icon/IconXCircle';
import { FiFilter } from 'react-icons/fi';
import { FiEdit3 } from 'react-icons/fi';

export const Report = () => {
    const tableData = [
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
        {
            id: 'Ms-0005616',
            Date: '24.02.2023',
            Type: 'Land',
            Famr: 'North',
            Product: 'Milk',
            Quanity: 940,
            UM: 'L',
            Source: 'Cows',
            Surface: 30,
            Value: 15532,
        },
    ];
    return (
        <div>
            <div className="header flex py-3 px-5 justify-between border-b-2">
                <h1 className="text-lg font-medium self-center">
                    Report _02.12.2024
                </h1>
                <div className="action flex gap-2">
                    <button className="bg-green-500 p-2 rounded-lg flex gap-2">
                        <RiDownloadLine className="self-center" />
                        Export
                    </button>
                    <button className="p-2 bg-gray-300 rounded-lg border-2 border-gray-400">
                        <BsThreeDots />
                    </button>
                </div>
            </div>
            <div className="headder-2 flex justify-between py-3 px-5 border-b-2">
                <h3 className="font-bold self-center">140 Results</h3>
                <div className="filterData flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            className="peer form-input 
                                        bg-gray-100 placeholder:tracking-widest ltr:pl-9 ltr:pr-9 rtl:pl-9 rtl:pr-9 sm:bg-transparent ltr:sm:pr-4 rtl:sm:pl-4"
                            placeholder="Search..."
                        />
                        <button
                            type="button"
                            className="absolute inset-0 h-9 w-9 appearance-none peer-focus:text-primary ltr:right-auto rtl:left-auto"
                        >
                            <IconSearch className="mx-auto" />
                        </button>
                        <button
                            type="button"
                            className="absolute top-1/2 block -translate-y-1/2 hover:opacity-80 ltr:right-2 rtl:left-2 sm:hidden"
                        >
                            <IconXCircle />
                        </button>
                    </div>
                    <button className="flex bg-gray-200 p-2 rounded-lg gap-2">
                        <FiFilter className="self-center" />
                        Filter
                    </button>
                </div>
            </div>
            <div className="selects flex flex-grow gap-3 px-5 py-2">
                <div className="flex-grow">
                    <label>Type</label>
                    <select name="" id="" className="border p-2 rounded-lg">
                        <option value="Land">Land</option>
                        <option value="Animal">Animal</option>
                    </select>
                </div>
                <div className="flex-grow">
                    <label>Farm</label>
                    <select name="" id="" className="border p-2 rounded-lg">
                        <option value="North">North</option>
                        <option value="South">South</option>
                    </select>
                </div>
                <div className="flex-grow">
                    <label>Product</label>
                    <select name="" id="" className="border p-2 rounded-lg">
                        <option value="Milt">Milk</option>
                        <option value="Meat">Meat</option>
                        <option value="Meat">Sunflower</option>
                    </select>
                </div>
                <div className="flex-grow">
                    <label>Source</label>
                    <select name="" id="" className="border p-2 rounded-lg">
                        <option value="Cows">Cows</option>
                        <option value="Goats">Goats</option>
                        <option value="Sheeps">Sunflower</option>
                    </select>
                </div>
            </div>
            <div className="table-responsive mb-5 mt-4">
                <table>
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Farm</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>U.M.</th>
                            <th>Source</th>
                            <th>Surface (ha)</th>
                            <th>Value (RWF)</th>
                            <th className="text-center">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map(data => {
                            return (
                                <tr key={data.id}>
                                    <td>
                                        <div className="whitespace-nowrap">
                                            {data.id}
                                        </div>
                                    </td>
                                    <td>{data.Date}</td>
                                    <td>{data.Type}</td>
                                    <td>{data.Famr}</td>
                                    <td>{data.Product}</td>
                                    <td>{data.Quanity}</td>
                                    <td>{data.UM}</td>
                                    <td>{data.Source}</td>
                                    <td>{data.Surface}</td>
                                    <td>{data.Value}</td>
                                    <td className="text-center">
                                        <button type="button">
                                            <FiEdit3 />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-green-300">
                            <td className="font-bold">Total</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td className="font-bold">6670</td>
                            <td></td>
                            <td></td>
                            <td className="font-bold">950</td>
                            <td className="font-bold">72900</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
