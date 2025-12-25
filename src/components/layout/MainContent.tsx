'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { ReactNode } from 'react';

export default function MainContent({ children }: { children: ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <main
            className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-16' : 'ml-56'
                }`}
        >
            {children}
        </main>
    );
}
