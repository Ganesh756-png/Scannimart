'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScanBarcode, ShieldCheck, Zap, ShoppingBag, ArrowRight } from 'lucide-react';
import LiveFeed from '@/components/LiveFeed';

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-teal-400 font-sans text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-teal-900/20 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-between">

        {/* Header / Nav */}
        <header className="flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <ScanBarcode className="w-8 h-8" />
            <span>SCAN NIMART</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-blue-50">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/admin/login" className="hover:text-white transition">Admin</Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row items-center justify-center gap-12 mt-8 lg:mt-0">

          {/* Left Side: Hero Text */}
          <motion.div
            className="text-center lg:text-left max-w-2xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-4 leading-tight drop-shadow-md">
              SCAN NIMART
            </h1>
            <h2 className="text-2xl lg:text-3xl font-light text-blue-100 mb-8 tracking-wide">
              Smart Self-Checkout System
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/customer/scan" className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group">
                <ShoppingBag className="w-5 h-5 group-hover:animate-bounce" />
                Start Shopping
              </Link>
              <Link href="/customer/scan" className="bg-blue-600/30 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-blue-600/50 transition-all">
                Pay Now
              </Link>
            </div>

            {/* App Store Badges (Visual) */}
            <div className="mt-12 flex gap-4 justify-center lg:justify-start opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer border border-white/20">
                <span className="text-2xl"></span>
                <div className="text-left leading-none">
                  <div className="text-[10px]">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </div>
              <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer border border-white/20">
                <span className="text-xl">▶</span>
                <div className="text-left leading-none">
                  <div className="text-[10px]">GET IT ON</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Hero Image & Feature Interactives */}
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl lg:max-w-md">

            {/* The User's Motto/Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-full aspect-square max-w-sm mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-white/20"
            >
              {/* Placeholder for the user to drop their image */}
              <img
                src="/scannimart-hero.jpg"
                alt="ScanniMart Motto"
                className="object-cover w-full h-full"
                onError={(e) => {
                  // Fallback if image not found
                  (e.currentTarget).style.display = 'none';
                  (e.currentTarget).parentElement!.innerText = 'Image not found. Please save user image as public/scannimart-hero.jpg';
                  (e.currentTarget).parentElement!.className += ' flex items-center justify-center bg-white/10 text-center p-4 text-sm';
                }}
              />
            </motion.div>

            {/* Interactive Feature Cards (Quick Links) */}
            <div className="grid grid-cols-3 gap-4 w-full">
              <motion.div
                className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex flex-col items-center text-center hover:bg-white/20 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Zap className="w-5 h-5 text-yellow-300 mb-1" />
                <span className="text-xs font-bold">Fast</span>
              </motion.div>
              <motion.div
                className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex flex-col items-center text-center hover:bg-white/20 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <ShieldCheck className="w-5 h-5 text-green-300 mb-1" />
                <span className="text-xs font-bold">Secure</span>
              </motion.div>
              <motion.div
                className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex flex-col items-center text-center hover:bg-white/20 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <ScanBarcode className="w-5 h-5 text-blue-300 mb-1" />
                <span className="text-xs font-bold">Scan</span>
              </motion.div>
            </div>

          </div>
        </main>

        {/* How It Works Section */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">Experience the future of shopping in 3 simple steps.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ScanBarcode, title: "1. Scan Item", desc: "Use our app to scan product barcodes or QR codes as you shop." },
              { icon: ShoppingBag, title: "2. Add to Cart", desc: "Review item details and add them to your digital cart instantly." },
              { icon: Zap, title: "3. Fast Checkout", desc: "Pay seamlessly through the app and skip the checkout line." }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-all text-center group"
              >
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-blue-100/80">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products Preview */}
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <Link href="/customer/scan" className="text-blue-100 hover:text-white flex items-center gap-2 transition">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Organic Avocados", price: "₹240", color: "bg-green-500/20" },
              { name: "Premium Headphones", price: "₹2,499", color: "bg-purple-500/20" },
              { name: "Smart Watch Series 7", price: "₹8,999", color: "bg-blue-500/20" },
              { name: "Energy Drink", price: "₹120", color: "bg-orange-500/20" }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 cursor-pointer"
              >
                <div className={`h-32 mb-4 rounded-xl ${item.color} flex items-center justify-center`}>
                  <ShoppingBag className="w-10 h-10 opacity-50" />
                </div>
                <h4 className="font-bold truncate">{item.name}</h4>
                <p className="text-blue-200">{item.price}</p>
                <button className="mt-3 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition">
                  Add +
                </button>
              </motion.div>
            ))}
          </div>
        </section>



        {/* Store Navigation Map */}
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">Store Navigation</h2>
              <p className="text-blue-100">Find your favorite products easily with our smart layout.</p>
            </motion.div>

            <div className="max-w-5xl mx-auto bg-white/10 rounded-3xl p-8 border border-white/10 relative overflow-hidden shadow-2xl">
              {/* Map Grid */}
              <div className="grid grid-cols-4 grid-rows-3 gap-4 h-[500px]">

                {/* Entrance */}
                <div className="row-span-3 col-span-1 bg-green-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-green-500/30 transition-colors group cursor-pointer relative">
                  <div className="absolute top-4 left-4 bg-green-500 text-xs px-2 py-1 rounded text-white font-bold">ENTRY</div>
                  <ScanBarcode className="w-12 h-12 mb-2 text-green-300 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xl">Fresh Produce</span>
                  <p className="text-xs text-green-100 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Fruits, Veggies, Organic</p>
                </div>

                {/* Aisles */}
                <div className="col-span-2 bg-blue-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-blue-500/30 transition-colors group cursor-pointer">
                  <ShoppingBag className="w-8 h-8 mb-2 text-blue-300" />
                  <span className="font-bold">Dairy & Frozen</span>
                </div>

                <div className="col-span-1 bg-yellow-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-yellow-500/30 transition-colors group cursor-pointer">
                  <Zap className="w-8 h-8 mb-2 text-yellow-300" />
                  <span className="font-bold">Bakery</span>
                </div>

                <div className="col-span-1 bg-purple-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-purple-500/30 transition-colors group cursor-pointer">
                  <ShoppingBag className="w-8 h-8 mb-2 text-purple-300" />
                  <span className="font-bold">Snacks</span>
                </div>

                <div className="col-span-2 bg-indigo-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-indigo-500/30 transition-colors group cursor-pointer">
                  <ShieldCheck className="w-8 h-8 mb-2 text-indigo-300" />
                  <span className="font-bold">Groceries & Staples</span>
                </div>

                {/* Checkout */}
                <div className="col-span-3 bg-red-500/20 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:bg-red-500/30 transition-colors group cursor-pointer relative">
                  <div className="absolute bottom-4 right-4 bg-red-500 text-xs px-2 py-1 rounded text-white font-bold">EXIT</div>
                  <div className="flex items-end gap-4">
                    <div className="text-center">
                      <span className="text-2xl font-bold block">Checkout Zone</span>
                      <span className="text-red-200 text-sm">Scan & Go Enabled</span>
                    </div>
                    <ArrowRight className="w-8 h-8 text-red-300 animate-pulse" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Footer Text */}
        <footer className="mt-12 text-center text-blue-100/80 text-sm font-medium tracking-widest uppercase">
          SHOP SMARTER. LIVE BETTER.
          <div className="mt-4 flex justify-center gap-6 text-xs text-white/50">
            <Link href="/test-barcodes" className="hover:text-white underline decoration-dashed">Product Codes</Link>
            <Link href="/admin/login" className="hover:text-white underline decoration-dashed">Staff Admin</Link>
            <Link href="/security/login" className="hover:text-white underline decoration-dashed">Security Check</Link>
          </div>
        </footer>
        <LiveFeed />
      </div >
    </div >
  );
}
