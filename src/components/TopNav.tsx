'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// tab SVG icons — because emoji look different on every OS and that's terrifying
const GridIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
        <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
        <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
        <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
    </svg>
);

const MapIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3.5l4 -1.5 6 3 4 -1.5v10l-4 1.5-6-3-4 1.5z" />
        <line x1="5" y1="2" x2="5" y2="13" />
        <line x1="11" y1="5" x2="11" y2="14" />
    </svg>
);

const tabs = [
    { href: '/', label: 'Grid', Icon: GridIcon },
    { href: '/map', label: 'Map', Icon: MapIcon },
];

export default function TopNav() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3 border-b border-white/[0.06] glass">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                {/* the logo — a whole pathfinding animation crammed into 36px */}
                <div className="flex items-center gap-2.5 select-none">
                    {/* invert flips white→black so it blends with dark nav, screen hides the black */}
                    <div className="shrink-0 rounded-md overflow-hidden" style={{ width: 36, height: 36 }}>
                        <img
                            src="/pathway.gif"
                            alt="Pathfinder logo"
                            width={36}
                            height={36}
                            style={{
                                filter: 'invert(1)',
                                mixBlendMode: 'screen',
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                    <span className="text-sm font-bold text-white tracking-wider hidden sm:inline font-mono">
                        PATHFINDER
                    </span>
                </div>

                {/* tab switcher — the most important two buttons on this page */}
                <div className="relative">
                    <div className="relative flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                        {tabs.map((t) => {
                            const active = pathname === t.href;
                            return (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 select-none whitespace-nowrap ${
                                        active
                                            ? 'bg-white text-zinc-900 shadow-md'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <t.Icon />
                                    <span>{t.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* right side — could put user auth here someday. someday. */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 font-mono">
                    <a
                        href="https://github.com/ksrahul23/Path-Finder-Algo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                        </svg>
                        Source
                    </a>
                </div>

            </div>
        </nav>
    );
}
