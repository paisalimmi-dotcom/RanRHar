import { apiClient } from '@/lib/api-client';

export type MenuItemAdmin = {
    id: number;
    name: string;
    priceTHB: number;
    imageUrl?: string;
};

export type MenuCategoryAdmin = {
    id: number;
    name: string;
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

    createCategory: async (name: string, sortOrder?: number): Promise<{ id: number; name: string; sortOrder: number }> => {
        return apiClient.post<{ id: number; name: string; sortOrder: number }>('/menu/categories', { name, sortOrder });
    },

    updateCategory: async (
        id: number,
        payload: { name?: string; sortOrder?: number }
    ): Promise<{ id: number; name: string; sortOrder: number }> => {
        return apiClient.patch<{ id: number; name: string; sortOrder: number }>(`/menu/categories/${id}`, payload);
    },

    deleteCategory: async (id: number): Promise<void> => {
        await apiClient.delete(`/menu/categories/${id}`);
    },

    createMenuItem: async (payload: {
        categoryId: number;
        name: string;
        priceTHB: number;
        imageUrl?: string | null;
    }): Promise<MenuItemAdmin> => {
        return apiClient.post<MenuItemAdmin>('/menu/items', payload);
    },

    updateMenuItem: async (
        id: number,
        payload: { name?: string; priceTHB?: number; imageUrl?: string | null }
    ): Promise<MenuItemAdmin> => {
        return apiClient.patch<MenuItemAdmin>(`/menu/items/${id}`, payload);
    },
};
