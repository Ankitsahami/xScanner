'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Book, MessageCircle, Terminal, Search, ExternalLink, FileText, Globe2 } from 'lucide-react';

export default function HelpPage() {
    const searchParams = useSearchParams();
    const resources = [
        {
            title: 'Xandeum Documentation',
            description: 'Official docs for Xandeum network',
            url: 'https://docs.xandeum.network',
            icon: Book
        },
        {
            title: 'Discord Community',
            description: 'Join the Xandeum Discord server',
            url: 'https://discord.gg/uqRSmmM5m',
            icon: MessageCircle
        },
        {
            title: 'API Reference',
            description: 'pRPC API documentation',
            url: 'https://xandeum.github.io/xandeum-web3.js',
            icon: Terminal
        },
    ];

    const [activeDoc, setActiveDoc] = useState('quick-start');

    const docs = {
        'quick-start': {
            name: 'QUICK_START.md',
            icon: Book,
            content: (
                <div className="space-y-6 animate-fade-in">
                    {/* Real Data Disclaimer */}
                    <div className="p-4 bg-brand-900/20 border border-brand-500/30 rounded-lg">
                        <h3 className="flex items-center gap-2 font-bold text-brand-400 mb-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                            REAL DATA ONLY
                        </h3>
                        <p className="text-sm text-brand-100/90 leading-relaxed">
                            <strong>Important:</strong> This application uses <strong>NO mock data</strong>.
                            Every bit of information displayed is fetched live directly from the Xandeum RPC.
                            What you see is the actual, current state of the network.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Start Guide</h2>
                        <p className="text-dark-200 leading-relaxed">
                            Welcome to <strong>xScaner</strong>, the premier real-time analytics dashboard designed specifically for the Xandeum network.
                            This platform provides a comprehensive window into the decentralized storage network&apos;s health and distribution.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">The Globe (Home)</h3>
                        <p className="text-dark-200 mb-2">
                            The landing page features a high-fidelity interactive 3D globe that visualizes every active pNode in the world.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-dark-300 ml-4">
                            <li><strong>Real-time Visualization:</strong> See nodes light up as they come online.</li>
                            <li><strong>Live Stats:</strong> Monitor total active nodes, storage capacity, and epoch progress.</li>
                            <li><strong>Interactive:</strong> Rotate, zoom, and click on any node to view details.</li>
                        </ul>
                    </div>

                    <div className="pt-6 border-t border-dark-700">
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Official Resources</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {resources.map((resource, i) => (
                                <a
                                    key={i}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col gap-2 p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-brand-500/30 hover:bg-dark-800 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <resource.icon className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
                                        <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-dark-400" />
                                    </div>
                                    <span className="font-medium text-sm text-foreground group-hover:text-brand-400 transition-colors">
                                        {resource.title}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        'analytics': {
            name: 'NETWORK_ANALYTICS.md',
            icon: Terminal,
            content: (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold mb-4 text-foreground">Network & Node Analytics</h2>
                    <p className="text-dark-200 leading-relaxed">
                        Dive deeper into the data with our dedicated analytics views. We provide two main perspectives:
                    </p>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Nodes List</h3>
                        <p className="text-dark-300 leading-relaxed">
                            A powerful tabular view of the network. You can sort and filter nodes by status (Online, Offline),
                            latency, or version. It allows you to find specific validators or storage providers quickly.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Network Health</h3>
                        <p className="text-dark-300 leading-relaxed">
                            Visualize the geographical distribution of the network across different countries and regions.
                            Understand where the network is most decentralized and where it needs growth.
                        </p>
                    </div>
                </div>
            )
        },
        'scan': {
            name: 'SCAN_VERIFY.md',
            icon: Search,
            content: (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold mb-4 text-foreground">Scan & Verification</h2>
                    <p className="text-dark-200 leading-relaxed">
                        The Scan page allows node operators to verify their node&apos;s visibility to the rest of the network.
                        Simply enter your IP address to see how the network sees you.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-dark-800/50 rounded-lg border border-green-500/20">
                            <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                                <span className="text-lg">+</span> Pros
                            </h4>
                            <ul className="text-sm space-y-2 list-disc list-inside text-dark-300">
                                <li>Instant verification of public visibility.</li>
                                <li>Visual confirmation of your node&apos;s connection to neighbors.</li>
                                <li>Validates your geo-location data.</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-dark-800/50 rounded-lg border border-red-500/20">
                            <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                                <span className="text-lg">-</span> Cons & Limitations
                            </h4>
                            <ul className="text-sm space-y-2 list-disc list-inside text-dark-300">
                                <li>Requires a static public IP for accurate tracking.</li>
                                <li>Geo-location accuracy depends on IP ISP data.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        'deployment': {
            name: 'DEPLOYMENT_STACK.md',
            icon: FileText,
            content: (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Deployment & Tech Stack</h2>
                        <h3 className="text-lg font-semibold text-foreground mb-2">How to Run Locally</h3>
                        <div className="bg-dark-950 p-4 rounded-lg font-mono text-sm text-dark-300 space-y-2 border border-dark-800 overflow-x-auto">
                            <div className="flex gap-3">
                                <span className="text-purple-400 select-none">$</span>
                                <span>git clone https://github.com/project-lab/xandeum-dashboard.git</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 select-none">$</span>
                                <span>cd xandeum-dashboard</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 select-none">$</span>
                                <span>npm install</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-purple-400 select-none">$</span>
                                <span>npm run dev</span>
                            </div>
                            <div className="text-dark-500 italic pt-2">{`// Open http://localhost:3000 in your browser`}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Tech Stack & Architecture</h3>
                        <p className="text-dark-200 mb-6 leading-relaxed">
                            This dashboard is built with a cutting-edge stack designed for performance, type safety, and visual fidelity.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-brand-500/30 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/5 rounded-md group-hover:bg-brand-500/10 transition-colors">
                                        <div className="font-bold text-white">N</div>
                                    </div>
                                    <h4 className="font-semibold text-foreground">Next.js 14</h4>
                                </div>
                                <p className="text-sm text-dark-300 leading-relaxed">
                                    The core framework leveraging React Server Components (RSC) and the App Router. It handles:
                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1 text-dark-400">
                                        <li>Server-side rendering for fast initial loads.</li>
                                        <li>API routes for secure RPC data fetching.</li>
                                        <li>Optimized routing and code splitting.</li>
                                    </ul>
                                </p>
                            </div>

                            <div className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-blue-500/30 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/5 rounded-md group-hover:bg-blue-500/10 transition-colors">
                                        <div className="font-bold text-blue-400">TS</div>
                                    </div>
                                    <h4 className="font-semibold text-foreground">TypeScript</h4>
                                </div>
                                <p className="text-sm text-dark-300 leading-relaxed">
                                    Ensures code reliability and developer productivity through static typing.
                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1 text-dark-400">
                                        <li>Type-safe interfaces for RPC responses (PNode, Epoch).</li>
                                        <li>Compile-time error checking.</li>
                                        <li>Enhanced IDE support and refactoring.</li>
                                    </ul>
                                </p>
                            </div>

                            <div className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-cyan-500/30 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/5 rounded-md group-hover:bg-cyan-500/10 transition-colors">
                                        <div className="font-bold text-cyan-400">CSS</div>
                                    </div>
                                    <h4 className="font-semibold text-foreground">Tailwind CSS</h4>
                                </div>
                                <p className="text-sm text-dark-300 leading-relaxed">
                                    A utility-first CSS framework for rapid, responsive UI development.
                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1 text-dark-400">
                                        <li>Custom design system implementation (colors, spacing).</li>
                                        <li>Glassmorphism and advanced visual effects.</li>
                                        <li>Fully responsive layout for all devices.</li>
                                    </ul>
                                </p>
                            </div>

                            <div className="p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-purple-500/30 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/5 rounded-md group-hover:bg-purple-500/10 transition-colors">
                                        <Globe2 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h4 className="font-semibold text-foreground">MapLibre GL</h4>
                                </div>
                                <p className="text-sm text-dark-300 leading-relaxed">
                                    The powerful WebGL-based mapping engine behind the 3D globe.
                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1 text-dark-400">
                                        <li>High-performance rendering of thousands of nodes.</li>
                                        <li>Custom shader support for glowing effects.</li>
                                        <li>Interactive camera controls and event handling.</li>
                                    </ul>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    };

    // Update active doc from URL parameter
    useEffect(() => {
        const docParam = searchParams.get('doc');
        if (docParam && docs[docParam as keyof typeof docs]) {
            setActiveDoc(docParam);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="h-[calc(100vh-140px)] min-h-[600px]">
                    {/* Content Viewer (Code/Doc View) */}
                    <div className="glass-card flex flex-col h-full overflow-hidden relative">
                        {/* Tab Bar */}
                        <div className="h-10 bg-dark-900/50 border-b border-dark-700 flex items-center px-2 w-full">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-dark-800/80 border-t-2 border-brand-500 text-xs font-mono text-dark-200 rounded-t-sm">
                                <div className="w-3 h-3">
                                    {(() => {
                                        const Icon = docs[activeDoc as keyof typeof docs].icon;
                                        return <Icon className="w-3 h-3 text-brand-500" />;
                                    })()}
                                </div>
                                {docs[activeDoc as keyof typeof docs].name}
                                <span className="ml-2 text-dark-500">×</span>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-dark-900/20 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
                            <div className="max-w-3xl mx-auto">
                                {docs[activeDoc as keyof typeof docs].content}
                            </div>
                        </div>

                        {/* Top Right Decoration */}
                        <div className="absolute top-3 right-4 flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
