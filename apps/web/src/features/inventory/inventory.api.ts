import { apiClient } from '@/lib/api-client';
import {
    InventoryItem,
    StockMovement,
    CreateInventoryItemPayload,
    UpdateInventoryItemPayload
} from '@/shared/types/inventory';

export const inventoryApi = {
    getItems: async (): Promise<InventoryItem[]> => {
        const response = await apiClient.get<{ items: InventoryItem[] }>('/inventory');
        return response.items;
    },

    createItem: async (payload: CreateInventoryItemPayload): Promise<InventoryItem> => {
        return apiClient.post<InventoryItem>('/inventory', payload);
    },

    updateItem: async (id: string, payload: UpdateInventoryItemPayload): Promise<InventoryItem> => {
        return apiClient.patch<InventoryItem>(`/inventory/${id}`, payload);
    },

    getMovements: async (id: string): Promise<StockMovement[]> => {
        const response = await apiClient.get<{ movements: StockMovement[] }>(`/inventory/${id}/movements`);
        return response.movements;
    },
};
