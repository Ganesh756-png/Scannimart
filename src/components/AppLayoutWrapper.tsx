'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import ShopBot from './ShopBot';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAppPage = pathname.startsWith('/customer') || 
                      pathname.startsWith('/security') || 
                      pathname === '/payment-gateway';

    if (isAppPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <ShopBot />
            <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm shrink-0">
                &copy; {new Date().getFullYear()} Scannimart. All rights reserved.
            </footer>
        </>
    );
}
