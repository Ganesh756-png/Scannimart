'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';

const NAMES = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Kavita", "Arjun", "Neha"];
const ITEMS = [
    "Organic Avocados", "Fresh Milk", "Whole Wheat Bread", "Smart Watch",
    "Wireless Headphones", "Green Tea", "Protein Bar", "Yoga Mat",
    "Almond Milk", "Dark Chocolate"
];
const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai"];

export default function LiveFeed() {
    const [notification, setNotification] = useState<{ name: string; item: string; location: string } | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const showNextNotification = () => {
            if (!isVisible) return;

            // 30% chance to show a notification every cycle
            if (Math.random() > 0.3) {
                const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
                const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

                setNotification({ name: randomName, item: randomItem, location: randomLocation });

                // Hide after 4 seconds
                setTimeout(() => {
                    setNotification(null);
                }, 4000);
            }
        };

        // Check every 8-12 seconds
        const interval = setInterval(showNextNotification, 8000);

        // Initial delay
        setTimeout(showNextNotification, 2000);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 z-40 pointer-events-none">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white/90 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-4 flex items-center gap-4 max-w-sm pointer-events-auto"
                    >
                        <div className="bg-green-100 p-2 rounded-full">
                            <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-800 font-medium">
                                <span className="font-bold">{notification.name}</span> from {notification.location}
                            </p>
                            <p className="text-xs text-green-600 font-bold">
                                Just bought {notification.item}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">Just now</p>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
