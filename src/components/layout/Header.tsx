'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    RefreshCw,
    ChevronDown
} from 'lucide-react';

interface HeaderProps {
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastUpdated?: number;
}

export default function Header({ onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [network] = useState('devnet');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [timeAgo, setTimeAgo] = useState('');

    // Update time ago display
    useEffect(() => {
        if (!lastUpdated) return;

        const updateTimeAgo = () => {
            const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
            if (seconds < 60) {
                setTimeAgo(`${seconds}s ago`);
            } else {
                setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000);
        return () => clearInterval(interval);
    }, [lastUpdated]);

    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/nodes?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700 sticky top-0 z-40">
            <div className="h-full flex items-center justify-between px-6">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search nodes by pubkey, address, or location..."
                            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-foreground placeholder:text-dark-300 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                    </div>
                </form>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Last updated */}
                    {timeAgo && (
                        <span className="text-sm text-dark-300">
                            {timeAgo}
                        </span>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {/* Network selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/30 rounded-lg text-sm text-brand-400 hover:bg-brand-500/20 transition-colors"
                        >
                            <span className="w-2 h-2 rounded-full bg-status-online animate-pulse" />
                            <span className="uppercase font-medium">{network}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isNetworkDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
                                <button
                                    onClick={() => setIsNetworkDropdownOpen(false)}
                                    className="w-full px-4 py-2 text-left text-sm text-brand-400 bg-brand-500/10 flex items-center justify-between"
                                >
                                    <span>DEVNET</span>
                                    <span className="w-2 h-2 rounded-full bg-status-online" />
                                </button>
                                <button
                                    disabled
                                    className="w-full px-4 py-2 text-left text-sm text-dark-400 cursor-not-allowed flex items-center justify-between hover:bg-dark-700/50"
                                >
                                    <span>MAINNET</span>
                                    <span className="text-[10px] bg-dark-700 px-1.5 py-0.5 rounded text-dark-300">Soon</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
