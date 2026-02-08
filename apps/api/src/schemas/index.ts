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
        Type.Literal('PENDING'),
        Type.Literal('CONFIRMED'),
        Type.Literal('COMPLETED'),
    ]),
});

// Payment schemas
export const RecordPaymentBodySchema = Type.Object({
    amount: Type.Number({ minimum: 0.01 }),
    method: Type.Union([Type.Literal('CASH'), Type.Literal('QR')]),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
});
