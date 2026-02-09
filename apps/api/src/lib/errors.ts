/**
 * Standardized Error Handling System
 * Olympic Standard: Typed error codes for consistent error responses
 */

export enum ErrorCode {
    // Authentication & Authorization (1xxx)
    AUTH_REQUIRED = 'AUTH_001',
    AUTH_INVALID_TOKEN = 'AUTH_002',
    AUTH_INVALID_CREDENTIALS = 'AUTH_003',
    AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',
    AUTH_SESSION_EXPIRED = 'AUTH_005',

    // Validation Errors (2xxx)
    VALIDATION_REQUIRED = 'VAL_001',
    VALIDATION_INVALID_FORMAT = 'VAL_002',
    VALIDATION_OUT_OF_RANGE = 'VAL_003',
    VALIDATION_INVALID_ID = 'VAL_004',
    VALIDATION_MISMATCH = 'VAL_005',

    // Order Errors (3xxx)
    ORDER_NOT_FOUND = 'ORD_001',
    ORDER_INVALID_TOTAL = 'ORD_002',
    ORDER_INVALID_ITEMS = 'ORD_003',
    ORDER_ALREADY_PAID = 'ORD_004',
    ORDER_CANNOT_CANCEL = 'ORD_005',
    ORDER_DUPLICATE = 'ORD_006',

    // Payment Errors (4xxx)
    PAYMENT_NOT_FOUND = 'PAY_001',
    PAYMENT_AMOUNT_MISMATCH = 'PAY_002',
    PAYMENT_ALREADY_EXISTS = 'PAY_003',
    PAYMENT_INVALID_METHOD = 'PAY_004',
    PAYMENT_REQUIRES_REFUND = 'PAY_005',

    // Menu Errors (5xxx)
    MENU_ITEM_NOT_FOUND = 'MEN_001',
    MENU_CATEGORY_NOT_FOUND = 'MEN_002',
    MENU_MODIFIER_NOT_FOUND = 'MEN_003',
    MENU_CATEGORY_HAS_ITEMS = 'MEN_004',
    MENU_INVALID_PRICE = 'MEN_005',

    // Reservation Errors (6xxx)
    RESERVATION_NOT_FOUND = 'RES_001',
    RESERVATION_INVALID_DATE = 'RES_002',
    RESERVATION_INVALID_TIME = 'RES_003',
    RESERVATION_ALREADY_EXISTS = 'RES_004',
    RESERVATION_CANNOT_CANCEL = 'RES_005',

    // Inventory Errors (7xxx)
    INVENTORY_ITEM_NOT_FOUND = 'INV_001',
    INVENTORY_INSUFFICIENT_STOCK = 'INV_002',
    INVENTORY_INVALID_QUANTITY = 'INV_003',

    // System Errors (9xxx)
    INTERNAL_ERROR = 'SYS_001',
    DATABASE_ERROR = 'SYS_002',
    RATE_LIMIT_EXCEEDED = 'SYS_003',
    SERVICE_UNAVAILABLE = 'SYS_004',
}

export interface ApiErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
        details?: Record<string, unknown>;
        requestId?: string;
    };
}

export class ApiError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: Record<string, unknown>;

    constructor(
        code: ErrorCode,
        message: string,
        statusCode: number = 400,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON(): ApiErrorResponse {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
            },
        };
    }
}

// Helper functions for common errors
export const Errors = {
    auth: {
        required: () => new ApiError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401),
        invalidToken: () => new ApiError(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid or expired token', 401),
        invalidCredentials: () => new ApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid email or password', 401),
        insufficientPermissions: (requiredRole?: string) =>
            new ApiError(
                ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
                requiredRole ? `Requires ${requiredRole} role` : 'Insufficient permissions',
                403
            ),
        sessionExpired: () => new ApiError(ErrorCode.AUTH_SESSION_EXPIRED, 'Session expired', 401),
    },

    validation: {
        required: (field: string) =>
            new ApiError(ErrorCode.VALIDATION_REQUIRED, `${field} is required`, 400, { field }),
        invalidFormat: (field: string, format: string) =>
            new ApiError(ErrorCode.VALIDATION_INVALID_FORMAT, `${field} must be ${format}`, 400, { field, format }),
        outOfRange: (field: string, min: number, max: number) =>
            new ApiError(ErrorCode.VALIDATION_OUT_OF_RANGE, `${field} must be between ${min} and ${max}`, 400, {
                field,
                min,
                max,
            }),
        invalidId: (id: string) => new ApiError(ErrorCode.VALIDATION_INVALID_ID, `Invalid ID: ${id}`, 400, { id }),
        mismatch: (message: string) => new ApiError(ErrorCode.VALIDATION_MISMATCH, message, 400),
    },

    order: {
        notFound: (id: string) => new ApiError(ErrorCode.ORDER_NOT_FOUND, `Order ${id} not found`, 404, { id }),
        invalidTotal: (expected: number, received: number) =>
            new ApiError(
                ErrorCode.ORDER_INVALID_TOTAL,
                `Order total mismatch: expected ${expected}, received ${received}`,
                400,
                { expected, received }
            ),
        invalidItems: (reason: string) =>
            new ApiError(ErrorCode.ORDER_INVALID_ITEMS, `Invalid order items: ${reason}`, 400, { reason }),
        alreadyPaid: (id: string) =>
            new ApiError(ErrorCode.ORDER_ALREADY_PAID, `Order ${id} is already paid`, 400, { id }),
        cannotCancel: (reason: string) =>
            new ApiError(ErrorCode.ORDER_CANNOT_CANCEL, `Cannot cancel order: ${reason}`, 403, { reason }),
        duplicate: () => new ApiError(ErrorCode.ORDER_DUPLICATE, 'Duplicate order detected', 409),
    },

    payment: {
        notFound: (id: string) => new ApiError(ErrorCode.PAYMENT_NOT_FOUND, `Payment ${id} not found`, 404, { id }),
        amountMismatch: (expected: number, received: number) =>
            new ApiError(
                ErrorCode.PAYMENT_AMOUNT_MISMATCH,
                `Payment amount mismatch: expected ${expected}, received ${received}`,
                400,
                { expected, received }
            ),
        alreadyExists: (orderId: string) =>
            new ApiError(ErrorCode.PAYMENT_ALREADY_EXISTS, `Payment already exists for order ${orderId}`, 400, {
                orderId,
            }),
        invalidMethod: (method: string) =>
            new ApiError(ErrorCode.PAYMENT_INVALID_METHOD, `Invalid payment method: ${method}`, 400, { method }),
        requiresRefund: (orderId: string) =>
            new ApiError(
                ErrorCode.PAYMENT_REQUIRES_REFUND,
                `Order ${orderId} is paid and requires refund instead of cancellation`,
                400,
                { orderId }
            ),
    },

    menu: {
        itemNotFound: (id: string) =>
            new ApiError(ErrorCode.MENU_ITEM_NOT_FOUND, `Menu item ${id} not found`, 404, { id }),
        categoryNotFound: (id: string) =>
            new ApiError(ErrorCode.MENU_CATEGORY_NOT_FOUND, `Menu category ${id} not found`, 404, { id }),
        modifierNotFound: (id: string) =>
            new ApiError(ErrorCode.MENU_MODIFIER_NOT_FOUND, `Menu modifier ${id} not found`, 404, { id }),
        categoryHasItems: (id: string) =>
            new ApiError(
                ErrorCode.MENU_CATEGORY_HAS_ITEMS,
                `Category ${id} has menu items. Move or delete items first.`,
                400,
                { id }
            ),
        invalidPrice: (price: number) =>
            new ApiError(ErrorCode.MENU_INVALID_PRICE, `Invalid price: ${price}`, 400, { price }),
    },

    reservation: {
        notFound: (id: string) =>
            new ApiError(ErrorCode.RESERVATION_NOT_FOUND, `Reservation ${id} not found`, 404, { id }),
        invalidDate: (date: string) =>
            new ApiError(ErrorCode.RESERVATION_INVALID_DATE, `Invalid reservation date: ${date}`, 400, { date }),
        invalidTime: (time: string) =>
            new ApiError(ErrorCode.RESERVATION_INVALID_TIME, `Invalid reservation time: ${time}`, 400, { time }),
        alreadyExists: () =>
            new ApiError(ErrorCode.RESERVATION_ALREADY_EXISTS, 'Reservation already exists', 409),
        cannotCancel: (reason: string) =>
            new ApiError(ErrorCode.RESERVATION_CANNOT_CANCEL, `Cannot cancel reservation: ${reason}`, 403, { reason }),
    },

    inventory: {
        itemNotFound: (id: string) =>
            new ApiError(ErrorCode.INVENTORY_ITEM_NOT_FOUND, `Inventory item ${id} not found`, 404, { id }),
        insufficientStock: (itemId: string, requested: number, available: number) =>
            new ApiError(
                ErrorCode.INVENTORY_INSUFFICIENT_STOCK,
                `Insufficient stock: requested ${requested}, available ${available}`,
                400,
                { itemId, requested, available }
            ),
        invalidQuantity: (quantity: number) =>
            new ApiError(ErrorCode.INVENTORY_INVALID_QUANTITY, `Invalid quantity: ${quantity}`, 400, { quantity }),
    },

    system: {
        internal: (message: string = 'Internal server error') =>
            new ApiError(ErrorCode.INTERNAL_ERROR, message, 500),
        database: (message: string) => new ApiError(ErrorCode.DATABASE_ERROR, `Database error: ${message}`, 500, { message }),
        rateLimit: () => new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', 429),
        unavailable: () => new ApiError(ErrorCode.SERVICE_UNAVAILABLE, 'Service temporarily unavailable', 503),
    },
};
