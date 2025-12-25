import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    size = 'md',
    className = '',
}: StatCardProps) {
    const sizeStyles = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    const valueStyles = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-4xl',
    };

    return (
        <div className={`stat-card ${sizeStyles[size]} ${className}`}>
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-dark-300 font-medium">
                    {title}
                </span>
                {Icon && (
                    <div className="p-1.5 rounded-lg bg-dark-700/50">
                        <Icon className="w-4 h-4 text-brand-400" />
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className={`${valueStyles[size]} font-semibold text-foreground`}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-dark-300 mt-1">{subtitle}</p>
                    )}
                </div>

                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-status-online' : 'text-status-offline'
                        }`}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact inline stat for dense displays
interface InlineStatProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    tooltip?: string;
}

export function InlineStat({ label, value, icon: Icon, tooltip }: InlineStatProps) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0" title={tooltip}>
            <div className="flex items-center gap-2 text-dark-200">
                {Icon && <Icon className="w-4 h-4 text-dark-400" />}
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
        </div>
    );
}
