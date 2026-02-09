'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/features/auth/auth.guard';
import { StaffNav } from '@/features/auth/components/StaffNav';
import { menuAdminApi, type MenuItemAdmin, type MenuCategoryAdmin } from '@/features/menu/menu-admin.api';
import { ImageUpload } from '@/components/ImageUpload';

function MenuItemEdit({
    item,
    onSaved,
}: {
    item: MenuItemAdmin;
    onSaved: () => void;
}) {
    const [name, setName] = useState(item.name);
    const [nameEn, setNameEn] = useState(item.nameEn ?? '');
    const [priceTHB, setPriceTHB] = useState(item.priceTHB);
    const [imageUrl, setImageUrl] = useState(item.imageUrl ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(item.name);
        setNameEn(item.nameEn ?? '');
        setPriceTHB(item.priceTHB);
        setImageUrl(item.imageUrl ?? '');
    }, [item]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await menuAdminApi.updateMenuItem(item.id, {
                name,
                nameEn: nameEn.trim() || undefined,
                priceTHB,
                imageUrl: imageUrl.trim() || null,
            });
            onSaved();
        } catch (e) {
            console.error(e);
            alert('บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-32 h-24 sm:h-auto sm:min-h-[100px] bg-gray-100 flex-shrink-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.currentTarget).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        ไม่มีรูป
                    </div>
                )}
            </div>
            <div className="p-4 flex-1 min-w-0">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">ชื่อ (ไทย)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">ชื่อ (English)</label>
                        <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            placeholder="English name"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">ราคา (฿)</label>
                        <input
                            type="number"
                            min={0}
                            value={priceTHB}
                            onChange={(e) => setPriceTHB(Number(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">URL รูปภาพ</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CategorySection({
    category,
    onCategorySaved,
    onCategoryDeleted,
    onItemSaved,
    onAddItem,
}: {
    category: MenuCategoryAdmin;
    onCategorySaved: () => void;
    onCategoryDeleted: () => void;
    onItemSaved: () => void;
    onAddItem: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(category.name);
    const [nameEn, setNameEn] = useState(category.nameEn ?? '');
    const [saving, setSaving] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemNameEn, setNewItemNameEn] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);
    const [newItemImage, setNewItemImage] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        setName(category.name);
        setNameEn(category.nameEn ?? '');
    }, [category.name, category.nameEn]);

    const handleSaveCategory = async () => {
        setSaving(true);
        try {
            await menuAdminApi.updateCategory(category.id, { name, nameEn: nameEn.trim() || undefined });
            setEditing(false);
            onCategorySaved();
        } catch (e) {
            console.error(e);
            alert('บันทึกหมวดหมู่ไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`ลบหมวดหมู่ "${category.name}"? (ต้องว่างเปล่าก่อน)`)) return;
        setSaving(true);
        try {
            await menuAdminApi.deleteCategory(category.id);
            onCategoryDeleted();
        } catch (e) {
            console.error(e);
            alert((e as { message?: string })?.message || 'ลบไม่ได้ — อาจมีรายการอยู่ในหมวดนี้');
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) {
            alert('กรุณากรอกชื่อ');
            return;
        }
        setAdding(true);
        try {
            await menuAdminApi.createMenuItem({
                categoryId: category.id,
                name: newItemName.trim(),
                nameEn: newItemNameEn.trim() || undefined,
                priceTHB: newItemPrice,
                imageUrl: newItemImage.trim() || null,
            });
            setNewItemName('');
            setNewItemNameEn('');
            setNewItemPrice(0);
            setNewItemImage('');
            setShowAddItem(false);
            onAddItem();
        } catch (e) {
            console.error(e);
            alert('เพิ่มรายการไม่สำเร็จ');
        } finally {
            setAdding(false);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {editing ? (
                        <>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="ชื่อ (ไทย)"
                                    className="px-2 py-1 border rounded text-base font-semibold"
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    value={nameEn}
                                    onChange={(e) => setNameEn(e.target.value)}
                                    placeholder="ชื่อ (English)"
                                    className="px-2 py-1 border rounded text-base font-semibold"
                                />
                            </div>
                            <button
                                onClick={handleSaveCategory}
                                disabled={saving}
                                className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                            >
                                บันทึก
                            </button>
                            <button onClick={() => setEditing(false)} className="text-sm text-gray-500">
                                ยกเลิก
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-gray-800">{category.name}</h2>
                            <button
                                onClick={() => setEditing(true)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                แก้ไข
                            </button>
                            <button
                                onClick={handleDelete}
                                className="text-sm text-red-600 hover:underline"
                            >
                                ลบ
                            </button>
                        </>
                    )}
                </div>
                <button
                    onClick={() => setShowAddItem(!showAddItem)}
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    + เพิ่มรายการ
                </button>
            </div>

            {showAddItem && (
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2 items-end">
                    <div>
                        <label className="block text-xs text-gray-500">ชื่อ (ไทย)</label>
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="ชื่อเมนู"
                            className="px-2 py-1 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">ชื่อ (English)</label>
                        <input
                            type="text"
                            value={newItemNameEn}
                            onChange={(e) => setNewItemNameEn(e.target.value)}
                            placeholder="English name"
                            className="px-2 py-1 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">ราคา (฿)</label>
                        <input
                            type="number"
                            min={0}
                            value={newItemPrice || ''}
                            onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <ImageUpload
                            value={newItemImage}
                            onChange={setNewItemImage}
                            label="รูปภาพ"
                            className="text-xs"
                        />
                    </div>
                    <button
                        onClick={handleAddItem}
                        disabled={adding}
                        className="px-4 py-1 bg-blue-600 text-white rounded"
                    >
                        {adding ? '...' : 'เพิ่ม'}
                    </button>
                </div>
            )}

            <div className="p-4 space-y-4">
                {category.items.map((item) => (
                    <MenuItemEdit key={item.id} item={item} onSaved={onItemSaved} />
                ))}
                {category.items.length === 0 && !showAddItem && (
                    <p className="text-gray-400 text-sm">ยังไม่มีรายการ — กด + เพิ่มรายการ</p>
                )}
            </div>
        </section>
    );
}

export default function AdminMenuPage() {
    const [categories, setCategories] = useState<MenuCategoryAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddCat, setShowAddCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatNameEn, setNewCatNameEn] = useState('');
    const [addingCat, setAddingCat] = useState(false);

    const fetchMenu = useCallback(async () => {
        setLoading(true);
        try {
            const data = await menuAdminApi.getMenu();
            setCategories(data.categories);
        } catch (e) {
            console.error(e);
            alert('โหลดเมนูไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const handleAddCategory = async () => {
        if (!newCatName.trim()) {
            alert('กรุณากรอกชื่อหมวดหมู่');
            return;
        }
        setAddingCat(true);
        try {
            await menuAdminApi.createCategory(newCatName.trim(), newCatNameEn.trim() || undefined, categories.length);
            setNewCatName('');
            setNewCatNameEn('');
            setShowAddCat(false);
            fetchMenu();
        } catch (e) {
            console.error(e);
            alert('เพิ่มหมวดหมู่ไม่สำเร็จ');
        } finally {
            setAddingCat(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['manager']}>
            <div className="min-h-screen bg-gray-100 pb-12">
                <header className="bg-white shadow">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                                ← Admin
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">จัดการเมนู</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="/menu/A12" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                ดูเมนูลูกค้า
                            </a>
                            <StaffNav />
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <p className="text-gray-600">
                            แยกหมวดหมู่เอง — เพิ่ม/แก้ไข/ลบหมวดหมู่ แล้วเพิ่มรายการอาหารในแต่ละหมวด
                        </p>
                        <button
                            onClick={() => setShowAddCat(!showAddCat)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            + เพิ่มหมวดหมู่
                        </button>
                    </div>

                    {showAddCat && (
                        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border flex flex-wrap gap-2 items-end">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ชื่อหมวดหมู่ (ไทย)</label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="เช่น อาหารจานหลัก เครื่องดื่ม"
                                    className="px-3 py-2 border rounded-lg w-64"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ชื่อหมวดหมู่ (English)</label>
                                <input
                                    type="text"
                                    value={newCatNameEn}
                                    onChange={(e) => setNewCatNameEn(e.target.value)}
                                    placeholder="e.g. Main Dishes, Beverages"
                                    className="px-3 py-2 border rounded-lg w-64"
                                />
                            </div>
                            <button
                                onClick={handleAddCategory}
                                disabled={addingCat}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                            >
                                {addingCat ? '...' : 'เพิ่ม'}
                            </button>
                            <button onClick={() => setShowAddCat(false)} className="text-gray-500">
                                ยกเลิก
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {categories.map((cat) => (
                                <CategorySection
                                    key={cat.id}
                                    category={cat}
                                    onCategorySaved={fetchMenu}
                                    onCategoryDeleted={fetchMenu}
                                    onItemSaved={fetchMenu}
                                    onAddItem={fetchMenu}
                                />
                            ))}
                            {categories.length === 0 && (
                                <p className="text-gray-500 text-center py-8">
                                    ยังไม่มีหมวดหมู่ — กด + เพิ่มหมวดหมู่ เพื่อเริ่มต้น
                                </p>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    );
}
