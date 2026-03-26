'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
    const pathname = usePathname();

    const tabs = [
        { href: '/', label: 'Grid', icon: '⬛' },
        { href: '/map', label: 'Map', icon: '🗺️' },
    ];

    return (
        <div className="px-6 py-3 border-b border-gray-800 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    
                </div>
                <div className="relative">
                    <div className="absolute -inset-[1px] rounded-xl bg-zinc-800 blur-sm opacity-60"></div>
                    <div className="relative flex gap-1 p-1 rounded-xl bg-gray-900/80 border border-gray-700">
                        {tabs.map((t) => {
                            const active = pathname === t.href;
                            return (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 select-none ${
                                        active
                                            ? 'bg-zinc-200 text-zinc-900 shadow-md'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="hidden md:block text-xs text-gray-500"></div>
            </div>
        </div>
    );
}


