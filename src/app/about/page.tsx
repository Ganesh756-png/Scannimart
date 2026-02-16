'use client';

export default function AboutPage() {
    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        About Our Mission
                    </h1>
                    <p className="mt-4 text-xl text-gray-500">
                        Revolutionizing the retail experience with smart technology.
                    </p>
                </div>

                <div className="space-y-16">
                    <div className="md:flex md:items-center md:space-x-8">
                        <div className="md:w-1/2">
                            <div className="bg-indigo-100 rounded-2xl h-64 w-full flex items-center justify-center text-indigo-300">
                                {/* Placeholder for an image */}
                                <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="md:w-1/2 mt-8 md:mt-0">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                We are a team of passionate developers and retail experts dedicated to solving the inefficiencies of traditional shopping. Our Smart Shopping System integrates cutting-edge web technologies, real-time database management, and intuitive user interfaces to create a seamless billing and checkout process.
                            </p>
                        </div>
                    </div>

                    <div className="md:flex md:items-center md:space-x-8 flex-col-reverse md:flex-row">
                        <div className="md:w-1/2 mt-8 md:mt-0">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Technology</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Built with Next.js, our platform offers lightning-fast performance and SEO optimization. We utilize MongoDB for robust data storage and TailwindCSS for beautiful, responsive designs. Our unique QR code scanning feature allows for instant product lookups and efficient inventory management.
                            </p>
                        </div>
                        <div className="md:w-1/2">
                            <div className="bg-purple-100 rounded-2xl h-64 w-full flex items-center justify-center text-purple-300">
                                {/* Placeholder for an image */}
                                <svg className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Ready to get started?</h2>
                    <div className="flex justify-center gap-4">
                        <a href="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Join Now
                        </a>
                        <a href="/contact" className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-indigo-50 transition shadow-md hover:shadow-lg">
                            Contact Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
