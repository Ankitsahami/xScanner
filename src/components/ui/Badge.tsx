interface BadgeProps {
    variant?: 'online' | 'syncing' | 'offline' | 'public' | 'private' | 'default';
    size?: 'sm' | 'md';
    children: React.ReactNode;
    dot?: boolean;
}

export default function Badge({
    variant = 'default',
    size = 'md',
    children,
    dot = false
}: BadgeProps) {
    const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
    };

    const variantStyles = {
        online: 'bg-status-online/20 text-status-online border border-status-online/30',
        syncing: 'bg-status-syncing/20 text-status-syncing border border-status-syncing/30',
        offline: 'bg-status-offline/20 text-status-offline border border-status-offline/30',
        public: 'bg-brand-500/20 text-brand-400 border border-brand-500/30',
        private: 'bg-dark-600/50 text-dark-200 border border-dark-500',
        default: 'bg-dark-700 text-dark-200 border border-dark-600',
    };

    const dotColors = {
        online: 'bg-status-online',
        syncing: 'bg-status-syncing',
        offline: 'bg-status-offline',
        public: 'bg-brand-400',
        private: 'bg-dark-400',
        default: 'bg-dark-400',
    };

    return (
        <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}>
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${variant === 'online' ? 'animate-pulse' : ''
                    }`} />
            )}
            {children}
        </span>
    );
}

// Status dot component
interface StatusDotProps {
    status: 'online' | 'syncing' | 'offline';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

export function StatusDot({ status, size = 'md', pulse = true }: StatusDotProps) {
    const sizeStyles = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
    };

    const colorStyles = {
        online: 'bg-status-online',
        syncing: 'bg-status-syncing',
        offline: 'bg-status-offline',
    };

    return (
        <span
            className={`inline-block rounded-full ${sizeStyles[size]} ${colorStyles[status]} ${pulse && status === 'online' ? 'animate-pulse' : ''
                }`}
        />
    );
}
