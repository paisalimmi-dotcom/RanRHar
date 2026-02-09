import { Type } from '@sinclair/typebox';

// Auth schemas
export const LoginBodySchema = Type.Object({
    email: Type.String({ minLength: 1, maxLength: 255 }),
    password: Type.String({ minLength: 1, maxLength: 128 }),
});

// Order schemas (world-class: strict limits)
export const OrderItemSchema = Type.Object({
    id: Type.String({ maxLength: 50 }),
    name: Type.String({ maxLength: 255 }),
    priceTHB: Type.Number({ minimum: 0, maximum: 999999.99 }),
    quantity: Type.Integer({ minimum: 1, maximum: 99 }),
});

export const CreateOrderBodySchema = Type.Object({
    items: Type.Array(OrderItemSchema, { minItems: 1, maxItems: 50 }),
    total: Type.Number({ minimum: 0.01 }),
});

export const CreateGuestOrderBodySchema = Type.Object({
    items: Type.Array(OrderItemSchema, { minItems: 1, maxItems: 50 }),
    total: Type.Number({ minimum: 0.01 }),
    tableCode: Type.Optional(Type.String({ maxLength: 50 })),
});

export const OrderIdParamSchema = Type.Object({
    id: Type.String({ pattern: '^[0-9]+$' }),
});

export const UpdateOrderStatusBodySchema = Type.Object({
    status: Type.Union([
        // Legacy statuses
        Type.Literal('PENDING'),
        Type.Literal('CONFIRMED'),
        Type.Literal('COMPLETED'),
        Type.Literal('CANCELLED'),
        // KDS statuses
        Type.Literal('NEW'),
        Type.Literal('ACCEPTED'),
        Type.Literal('COOKING'),
        Type.Literal('READY'),
        Type.Literal('SERVED'),
    ]),
});

export const CancelOrderBodySchema = Type.Object({
    reason: Type.Optional(Type.String({ maxLength: 500 })),
    refundRequired: Type.Optional(Type.Boolean()),
});

// Payment schemas
export const RecordPaymentBodySchema = Type.Object({
    amount: Type.Number({ minimum: 0.01 }),
    method: Type.Union([Type.Literal('CASH'), Type.Literal('QR')]),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
});

// Split bill schema
export const SplitPaymentItemSchema = Type.Object({
    amount: Type.Number({ minimum: 0.01 }),
    method: Type.Union([Type.Literal('CASH'), Type.Literal('QR')]),
    payer: Type.Optional(Type.String({ maxLength: 255 })),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
});

export const SplitPaymentBodySchema = Type.Object({
    payments: Type.Array(SplitPaymentItemSchema, { minItems: 2, maxItems: 10 }),
});

// Combined bill schema
export const CombinedPaymentBodySchema = Type.Object({
    orderIds: Type.Array(Type.String({ pattern: '^[0-9]+$' }), { minItems: 2, maxItems: 10 }),
    amount: Type.Number({ minimum: 0.01 }),
    method: Type.Union([Type.Literal('CASH'), Type.Literal('QR')]),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
});
