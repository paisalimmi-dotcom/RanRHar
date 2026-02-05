'use client';

import React from 'react';
import { useMenu } from '../hooks/useMenu';

interface MenuPageProps {
    tableCode: string;
}

export const MenuPage: React.FC<MenuPageProps> = ({ tableCode }) => {
    const { isLoading, error, restaurant, menu } = useMenu(tableCode);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
                <div className="animate-pulse text-xl font-medium">Loading Menu...</div>
                <div className="text-sm text-gray-500 mt-2">Table: {tableCode}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600 p-4 text-center">
                <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3 flex flex-col items-center justify-center">
                <h1 className="text-xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{restaurant?.branchName}</p>
                <div className="absolute right-4 top-4 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono hidden sm:block">
                    Table: {tableCode}
                </div>
            </header>

            {/* Menu Content */}
            <main className="max-w-md mx-auto p-4">
                {/* Table info for mobile */}
                <div className="mb-6 text-center sm:hidden">
                    <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Table: {tableCode}</span>
                </div>

                <section>
                    <h2 className="text-2xl font-bold mb-4">{menu?.name || 'Menu'}</h2>

                    <div className="space-y-4">
                        {menu?.items && menu.items.length > 0 ? (
                            menu.items.map((item) => (
                                <div key={item.id} className="border rounded-lg p-4 shadow-sm flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{item.name}</h3>
                                        {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                                        <p className="text-primary font-medium mt-2">${item.price.toFixed(2)}</p>
                                    </div>
                                    {/* Placeholder for image */}
                                    <div className="w-20 h-20 bg-gray-200 rounded-md shrink-0 ml-4"></div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No items found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer / Cart Placeholder */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-md mx-auto text-center text-sm text-gray-400">
                    Viewing as Customer
                </div>
            </div>
        </div>
    );
};
