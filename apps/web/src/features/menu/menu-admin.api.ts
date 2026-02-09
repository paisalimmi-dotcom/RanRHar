import { apiClient } from '@/lib/api-client';

export type MenuItemAdmin = {
    id: number;
    name: string;
    nameEn?: string;
    priceTHB: number;
    imageUrl?: string;
};

export type MenuCategoryAdmin = {
    id: number;
    name: string;
    nameEn?: string;
    sortOrder?: number;
    items: MenuItemAdmin[];
};

export type MenuAdminResponse = {
    restaurant: { name: string; branchName: string };
    categories: MenuCategoryAdmin[];
};

export const menuAdminApi = {
    getMenu: async (): Promise<MenuAdminResponse> => {
        return apiClient.get<MenuAdminResponse>('/menu/admin');
    },

    createCategory: async (name: string, nameEn?: string, sortOrder?: number): Promise<{ id: number; name: string; nameEn?: string; sortOrder: number }> => {
        return apiClient.post<{ id: number; name: string; nameEn?: string; sortOrder: number }>('/menu/categories', { name, nameEn, sortOrder });
    },

    updateCategory: async (
        id: number,
        payload: { name?: string; nameEn?: string; sortOrder?: number }
    ): Promise<{ id: number; name: string; nameEn?: string; sortOrder: number }> => {
        return apiClient.patch<{ id: number; name: string; nameEn?: string; sortOrder: number }>(`/menu/categories/${id}`, payload);
    },

    deleteCategory: async (id: number): Promise<void> => {
        await apiClient.delete(`/menu/categories/${id}`);
    },

    createMenuItem: async (payload: {
        categoryId: number;
        name: string;
        nameEn?: string;
        priceTHB: number;
        imageUrl?: string | null;
    }): Promise<MenuItemAdmin> => {
        return apiClient.post<MenuItemAdmin>('/menu/items', payload);
    },

    updateMenuItem: async (
        id: number,
        payload: { name?: string; nameEn?: string; priceTHB?: number; imageUrl?: string | null }
    ): Promise<MenuItemAdmin> => {
        return apiClient.patch<MenuItemAdmin>(`/menu/items/${id}`, payload);
    },

    // Modifiers API
    createModifier: async (
        itemId: number,
        payload: { name: string; nameEn?: string; priceDelta?: number; sortOrder?: number }
    ): Promise<{ id: number; name: string; nameEn?: string; priceDelta: number; sortOrder: number }> => {
        return apiClient.post(`/menu/items/${itemId}/modifiers`, payload);
    },

    updateModifier: async (
        id: number,
        payload: { name?: string; nameEn?: string; priceDelta?: number; sortOrder?: number; isActive?: boolean }
    ): Promise<{ id: number; name: string; nameEn?: string; priceDelta: number; sortOrder: number; isActive: boolean }> => {
        return apiClient.patch(`/menu/modifiers/${id}`, payload);
    },

    deleteModifier: async (id: number): Promise<void> => {
        await apiClient.delete(`/menu/modifiers/${id}`);
    },
};
