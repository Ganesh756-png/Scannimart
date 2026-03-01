'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Zap, ShieldCheck, Smartphone, Users, ChevronRight, Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const teamMembers = [
        {
            initials: 'GT',
            name: 'Ganesh Thakur',
            role: 'Founder & Developer',
            description: 'Visionary behind the core architecture and user experience.',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            initials: 'GS',
            name: 'Govind Sawant',
            role: 'Co-Founder & Developer',
            description: 'Leading the database integration and real-time scanning systems.',
            gradient: 'from-purple-500 to-pink-600',
        },
        {
            initials: 'OP',
            name: 'Omkar Parab',
            role: 'Manager & Coordinator',
            description: 'Ensuring smooth project execution and seamless team collaboration.',
            gradient: 'from-teal-400 to-emerald-600',
        }
    ];

    const features = [
        {
            icon: <Smartphone className="w-8 h-8 text-indigo-500" />,
            title: "Mobile First",
            description: "Scan barcodes directly from your smartphone browser, no extra apps needed."
        },
        {
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            title: "Real-time Sync",
            description: "Your cart instantly synchronizes across all devices and the checkout counter."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
            title: "Secure Checkout",
            description: "Bank-grade encryption ensures your payment data is always protected."
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white overflow-hidden relative selection:bg-indigo-500/30">
            {/* Background Animated Blobs */}
            <div className="absolute inset-0 w-full h-full overflow-hidden top-0 left-0 z-0 pointer-events-none flex justify-center items-center opacity-40">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">

                {/* Hero Section */}
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-32"
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-neutral-300 tracking-wide uppercase">Revolutionizing Retail</span>
                    </motion.div>

                    <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                        Shopping, but <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">smarter.</span>
                    </motion.h1>

                    <motion.p variants={fadeIn} className="text-xl text-neutral-400 leading-relaxed">
                        We are stripping away the friction of traditional retail. No more checkout lines. No more waiting. Just scan, pay, and go.
                    </motion.p>
                </motion.div>

                {/* Mission & Tech Split Section */}
                <div className="grid md:grid-cols-2 gap-16 mb-32 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
                            <ShoppingCart className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold">Who We Are</h2>
                        <p className="text-lg text-neutral-400 leading-relaxed">
                            We are a team of passionate developers and retail experts dedicated to solving the inefficiencies of traditional shopping. Our platform integrates cutting-edge web technologies and real-time database management to create a seamless billing process.
                        </p>
                        <ul className="space-y-4 text-neutral-300">
                            {['Eliminate checkout queues', 'Real-time inventory tracking', 'Contactless payments', 'Personalized insights'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden glass-panel border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            {/* Abstract Tech Visual */}
                            <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 sm:gap-6">
                                {features.map((feature, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.2, duration: 0.5 }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 flex items-start gap-4 hover:bg-white/10 transition-colors backdrop-blur-md z-10"
                                    >
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-base sm:text-lg">{feature.title}</h3>
                                            <p className="text-neutral-400 text-xs sm:text-sm mt-1">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Decorative elements */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Team Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="py-16 border-t border-white/10 relative"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Meet the Dream Team</h2>
                        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                            The creative minds engineering the future of retail experiences.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {teamMembers.map((member, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm flex flex-col items-center text-center h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                                <div className={`w-32 h-32 rounded-full mb-6 bg-gradient-to-tr ${member.gradient} flex-shrink-0 flex items-center justify-center text-white text-4xl font-bold shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-shadow duration-500 relative overflow-hidden`}>
                                    <span className="relative z-10">{member.initials}</span>
                                    <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-700 ease-out rounded-full z-0"></div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                                <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-medium mb-4">{member.role}</p>
                                <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-grow">
                                    {member.description}
                                </p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <button className="text-neutral-500 hover:text-white transition-colors">
                                        <Github className="w-5 h-5" />
                                    </button>
                                    <button className="text-neutral-500 hover:text-[#0077b5] transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                    </button>
                                    <button className="text-neutral-500 hover:text-white transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 border border-white/10 p-12 md:p-20 text-center flex flex-col items-center justify-center"
                >
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay"></div>
                    <Zap className="w-12 h-12 text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to experience the future?</h2>
                    <p className="text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto">
                        Join thousands of shoppers who have already upgraded their retail experience. It's fast, secure, and incredibly simple.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                        <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-950 rounded-full font-bold text-lg hover:bg-neutral-200 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            Get Started Free
                        </Link>
                        <Link href="/contact" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/5 transition-all">
                            Contact Sales
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
