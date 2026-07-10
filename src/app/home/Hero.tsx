import React, { useState } from "react";

function Index() {
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        message: "",
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                alert("Your request has been sent successfully!");
                setFormData({
                    full_name: "",
                    email: "",
                    phone: "",
                    message: "",
                });
            } else {
                alert("Failed to send your request.");
            }
        } catch (error) {
            console.error("Error sending email:", error);
            alert("There was an error sending your request.");
        }
    };

    return (
        <div className="container mx-auto my-a ">
            <div className="lg:flex">
            <div className="xl:w-2/5 lg:w-2/5 bg-green-700 py-16 xl:rounded-bl rounded-tl rounded-tr xl:rounded-tr-none">
    <div className="xl:w-5/6 xl:px-0 px-8 mx-auto">
        <h1 className="xl:text-2xl text-xl pb-4 text-white font-bold">Get in touch</h1>
        <p className="text-lg text-white pb-6 leading-relaxed font-normal lg:pr-4">
            Got a question about us? Are you interested in partnering with us? Have some suggestions or just want to say Hi? Just contact us. We are here to assist you.
        </p>
        <div className="flex pb-3 items-center">
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-phone-call" width={16} height={16} viewBox="0 0 24 24" strokeWidth="1.5" stroke="#ffffff" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <path d="M4 4h5l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v5a1 1 0 0 1 -1 1a16 16 0 0 1 -16 -16a1 1 0 0 1 1 -1" />
                    <path d="M15 7a2 2 0 0 1 2 2" />
                    <path d="M15 3a6 6 0 0 1 6 6" />
                </svg>
            </div>
            <p className="pl-4 text-white text-lg">+(250) 781 120 101</p>
        </div>
        <div className="flex items-center">
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-mail" width={16} height={16} viewBox="0 0 24 24" strokeWidth="1.5" stroke="#FFFFFF" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <rect x={3} y={5} width={18} height={14} rx={2} />
                    <polyline points="3 7 12 13 21 7" />
                </svg>
            </div>
            <p className="pl-4 text-white text-lg">Info@difarm.com</p>
        </div>
        <p className="text-lg  text-white pt-6 tracking-wide">
            kigali Rwanda <br />
           st-120
        </p>
       
    </div>
</div>

                <div className="xl:w-3/5 lg:w-3/5 bg-gray-200 h-full pt-5 pb-5 xl:pr-5 xl:pl-0 rounded-tr rounded-br">
                    <ContactForm/>
                </div>
            </div>
        </div>
    );
}

export default Index;


import emailjs from 'emailjs-com';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        emailjs.sendForm('service_he2kof7', 'template_tsfpv5a', e.target as HTMLFormElement, 'r7ua9HIEoc_r_6eM2')
            .then((result) => {
                alert('Email sent successfully!');
                setFormData({ name: '', email: '', message: '' }); // Clear the form after submission
            }, (error) => {
                console.log('Error:', error);
                alert('Failed to send email. Please try again.');
            });
    };

    return (
        <div className="bg-gray-50 p-10 rounded-lg shadow-lg max-w-lg mx-auto" id="contact">
            <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Contact Us</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <label htmlFor="name" className="block text-md font-semibold text-gray-700 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 transition duration-200 ease-in-out"
                        placeholder="Enter your full name"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="email" className="block text-md font-semibold text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 transition duration-200 ease-in-out"
                        placeholder="Enter your email address"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="message" className="block text-md font-semibold text-gray-700 mb-2">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-green-200 focus:outline-none text-gray-700 transition duration-200 ease-in-out"
                        placeholder="Write your message here"
                    />
                </div>
                <div className="text-center">
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Send Message
                    </button>
                </div>
            </form>
        </div>
    );
};

