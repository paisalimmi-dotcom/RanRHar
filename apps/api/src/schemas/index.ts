import { Type } from '@sinclair/typebox';

// Auth schemas
export const LoginBodySchema = Type.Object({
    email: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 1 }),
});

// Order schemas
export const OrderItemSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    priceTHB: Type.Number({ minimum: 0 }),
    quantity: Type.Integer({ minimum: 1 }),
});

export const CreateOrderBodySchema = Type.Object({
    items: Type.Array(OrderItemSchema, { minItems: 1 }),
    total: Type.Number({ minimum: 0.01 }),
});

export const CreateGuestOrderBodySchema = Type.Object({
    items: Type.Array(OrderItemSchema, { minItems: 1 }),
    total: Type.Number({ minimum: 0.01 }),
    tableCode: Type.Optional(Type.String()),
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
    notes: Type.Optional(Type.String()),
});
