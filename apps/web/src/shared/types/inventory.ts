export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    minQuantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface StockMovement {
    id: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    createdAt: string;
    createdByEmail: string;
}

export interface CreateInventoryItemPayload {
    name: string;
    quantity: number;
    unit: string;
    minQuantity: number;
}

export interface AdjustStockPayload {
    type: StockMovementType;
    quantity: number;
    reason: string;
}

export interface UpdateInventoryItemPayload {
    name?: string;
    minQuantity?: number;
    adjustment?: AdjustStockPayload;
}
