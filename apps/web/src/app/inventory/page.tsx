'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/features/auth/auth.guard';
import { StaffNav } from '@/features/auth/components/StaffNav';
import InventoryTable from '@/features/inventory/components/InventoryTable';
import ItemModal from '@/features/inventory/components/ItemModal';
import StockAdjustmentModal from '@/features/inventory/components/StockAdjustmentModal';
import { inventoryApi } from '@/features/inventory/inventory.api';
import { InventoryItem, AdjustStockPayload, CreateInventoryItemPayload } from '@/shared/types/inventory';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await inventoryApi.getItems();
            setItems(data);
        } catch (error) {
            console.error('Fetch inventory failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSaveItem = async (data: any) => {
        if (editingItem) {
            await inventoryApi.updateItem(editingItem.id, data);
        } else {
            await inventoryApi.createItem(data as CreateInventoryItemPayload);
        }
        await fetchInventory();
    };

    const handleAdjustStock = async (payload: AdjustStockPayload) => {
        if (!adjustingItem) return;
        await inventoryApi.updateItem(adjustingItem.id, { adjustment: payload });
        await fetchInventory();
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingItem(null);
        setIsItemModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };

    const openAdjustModal = (item: InventoryItem) => {
        setAdjustingItem(item);
        setIsAdjustModalOpen(true);
    };

    return (
        <AuthGuard allowedRoles={['manager', 'staff']}>
            <div className="min-h-screen bg-gray-100 pb-12">
                {/* Header */}
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">Beta</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <StaffNav />
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                        <div className="relative w-full sm:max-w-md">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search ingredients or items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:transform active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2"
                        >
                            <span>+</span>
                            <span>Add New Item</span>
                        </button>
                    </div>

                    {/* Dashboard Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500 font-medium uppercase">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                            <p className="text-sm text-gray-500 font-medium uppercase">Low Stock Alerts</p>
                            <p className="text-2xl font-bold text-red-600">
                                {items.filter(i => i.quantity <= i.minQuantity).length}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                            <p className="text-sm text-gray-500 font-medium uppercase">Healthy Stock</p>
                            <p className="text-2xl font-bold text-green-600">
                                {items.filter(i => i.quantity > i.minQuantity).length}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow p-12 text-center">
                            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
                                <span className="sr-only">Loading...</span>
                            </div>
                            <p className="mt-4 text-gray-500">Loading inventory data...</p>
                        </div>
                    ) : (
                        <InventoryTable
                            items={filteredItems}
                            onEdit={openEditModal}
                            onAdjust={openAdjustModal}
                        />
                    )}
                </main>

                {/* Modals */}
                <ItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    onSave={handleSaveItem}
                    editingItem={editingItem}
                />

                <StockAdjustmentModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    onAdjust={handleAdjustStock}
                    item={adjustingItem}
                />
            </div>
        </AuthGuard>
    );
}
