'use client';

export default function ContactPage() {
    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Contact Us
                    </h2>
                    <p className="mt-4 text-lg text-gray-500">
                        We'd love to hear from you. Send us a message!
                    </p>
                </div>

                <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">
                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                        <form action="#" method="POST" className="grid grid-cols-1 gap-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">Full name</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="full-name"
                                        id="full-name"
                                        autoComplete="name"
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md bg-gray-50"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md bg-gray-50"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                <div className="mt-1">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md bg-gray-50"
                                        placeholder="How can we help you?"
                                    />
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-indigo-700 rounded-2xl shadow-xl overflow-hidden p-8 text-white flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-4">Get in touch</h3>
                        <p className="text-indigo-100 mb-8">
                            Have questions about our smart shopping system? Need technical support? We are here to help.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-indigo-300 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">Ganesh Govind Thakur</span>
                            </div>
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-indigo-300 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>123 Innovation Drive, Tech City, TC 90210</span>
                            </div>
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-indigo-300 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div className="flex flex-col">
                                    <a href="tel:8975068938" className="hover:text-white transition font-medium">
                                        +91 8975068938
                                    </a>
                                    <span className="text-sm text-indigo-200">(Call & Chat)</span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-indigo-300 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>support@smartshopping.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
