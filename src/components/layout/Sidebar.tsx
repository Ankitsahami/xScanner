'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Globe2,
    LayoutGrid,
    BarChart3,
    MapPin,
    Scan,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    children?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
    { name: 'Overview', href: '/', icon: Globe2 },
    { name: 'Nodes', href: '/nodes', icon: LayoutGrid },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Regions', href: '/regions', icon: MapPin },
    { name: 'Scan', href: '/scan', icon: Scan },
    {
        name: 'Help',
        href: '/help',
        icon: HelpCircle,
        children: [
            { name: 'Quick Start', href: '/help?doc=quick-start' },
            { name: 'Analytics', href: '/help?doc=analytics' },
            { name: 'Scan', href: '/help?doc=scan' },
            { name: 'Deployment', href: '/help?doc=deployment' },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({ 'Help': true }); // Default Help expanded

    const toggleItem = (name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-dark-900 border-r border-dark-700 transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-16' : 'w-56'
                }`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <Globe2 className="w-5 h-5 text-dark-900" />
                        </div>
                        <span className="font-semibold text-lg gradient-text">xScaner</span>
                    </Link>
                )}

                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-foreground transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    const isExpanded = expandedItems[item.name];
                    const hasChildren = item.children && item.children.length > 0;

                    return (
                        <div key={item.name}>
                            <div className="relative flex items-center">
                                <Link
                                    href={item.href}
                                    className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                                        : 'text-dark-200 hover:text-foreground hover:bg-dark-800'
                                        }`}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-dark-300 group-hover:text-foreground'
                                        }`} />

                                    {!isCollapsed && (
                                        <>
                                            <span className="font-medium">{item.name}</span>
                                            {item.badge && (
                                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isActive
                                                    ? 'bg-brand-500/20 text-brand-300'
                                                    : 'bg-dark-700 text-dark-200'
                                                    }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Link>

                                {/* Dropdown Toggle */}
                                {!isCollapsed && hasChildren && (
                                    <button
                                        onClick={(e) => toggleItem(item.name, e)}
                                        className={`absolute right-2 p-1 rounded-md hover:bg-dark-700transition-colors ${isExpanded ? 'text-foreground' : 'text-dark-400'}`}
                                    >
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>

                            {/* Sub-menu */}
                            {!isCollapsed && hasChildren && isExpanded && (
                                <div className="ml-9 mt-1 space-y-1 border-l border-dark-700 pl-2 animate-slide-down">
                                    {item.children!.map((child) => {
                                        // Simple check: active if URL contains query param
                                        // Note: useSearchParams is not available directly here unless we wrap or use client hooks.
                                        // But we can check full href match roughly or just let standard link handle it.
                                        // For highlighting, we might need a more robust check in a real app,
                                        // but checking if pathname matches child.href base is tricky with query params.
                                        // Let's just render as normal links.

                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${pathname === '/help' && child.href.includes(typeof window !== 'undefined' ? window.location.search : '')
                                                    ? 'text-brand-400 bg-brand-500/5'
                                                    : 'text-dark-300 hover:text-foreground hover:bg-dark-800'
                                                    }`}
                                            >
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Collapse indicator for collapsed state */}
            {isCollapsed && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="w-8 h-1 rounded-full bg-dark-600" />
                </div>
            )}
        </aside>
    );
}
