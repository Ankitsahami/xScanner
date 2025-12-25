'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    sortable?: boolean;
    width?: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    onRowClick?: (item: T) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    itemsPerPage?: number;
    className?: string;
    customFilter?: (item: T, query: string) => boolean;
    initialSearchQuery?: string;
}

export default function DataTable<T extends object>({
    data,
    columns,
    keyField,
    onRowClick,
    searchable = true,
    searchPlaceholder = 'Search...',
    itemsPerPage = 10,
    className = '',
    customFilter,
    initialSearchQuery = '',
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter and sort data
    const processedData = useMemo(() => {
        let filtered = [...data];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                if (customFilter) {
                    return customFilter(item, query);
                }
                return Object.values(item).some(value =>
                    String(value).toLowerCase().includes(query)
                );
            });
        }

        // Sort
        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof T];
                const bValue = b[sortConfig.key as keyof T];

                if (aValue === bValue) return 0;

                const comparison = aValue < bValue ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, searchQuery, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const paginatedData = processedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return prev.direction === 'asc'
                    ? { key, direction: 'desc' }
                    : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const handleExport = (format: 'csv' | 'json') => {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            a.click();
        } else {
            const headers = columns.map(c => c.header).join(',');
            const rows = processedData.map(item =>
                columns.map(c => {
                    const value = item[c.key as keyof T];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',')
            );
            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.csv';
            a.click();
        }
    };

    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between gap-4">
                {searchable && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button className="btn-ghost flex items-center gap-2 text-sm">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                    <div className="relative group">
                        <button className="btn-ghost flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <button
                                onClick={() => handleExport('csv')}
                                className="block w-full px-4 py-2 text-sm text-left hover:bg-dark-700"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={() => handleExport('json')}
                                className="block w-full px-4 py-2 text-sm text-left hover:bg-dark-700"
                            >
                                Export JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-dark-800/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key as string}
                                    className={`px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-foreground' : ''
                                        }`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.key as string)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{column.header}</span>
                                        {column.sortable && sortConfig?.key === column.key && (
                                            sortConfig.direction === 'asc'
                                                ? <ChevronUp className="w-3 h-3" />
                                                : <ChevronDown className="w-3 h-3" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                        {paginatedData.map((item) => (
                            <tr
                                key={String(item[keyField])}
                                onClick={() => onRowClick?.(item)}
                                className={`${onRowClick ? 'cursor-pointer hover:bg-dark-800/50' : ''
                                    } transition-colors`}
                            >
                                {columns.map((column) => (
                                    <td key={column.key as string} className="px-4 py-3 text-sm">
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key as keyof T] ?? '-')
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-dark-700 flex items-center justify-between">
                    <p className="text-sm text-dark-300">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, processedData.length)} of{' '}
                        {processedData.length} results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="btn-ghost text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-dark-300">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="btn-ghost text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
