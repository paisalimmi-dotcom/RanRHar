import { describe, it, expect } from 'vitest';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import {
    LoginBodySchema,
    CreateOrderBodySchema,
    CreateGuestOrderBodySchema,
    UpdateOrderStatusBodySchema,
    RecordPaymentBodySchema,
    OrderIdParamSchema,
} from './index';

describe('API Schemas', () => {
    describe('LoginBodySchema', () => {
        const compile = TypeCompiler.Compile(LoginBodySchema);

        it('accepts valid login', () => {
            expect(compile.Check({ email: 'test@test.com', password: 'secret' })).toBe(true);
        });

        it('rejects empty email', () => {
            expect(compile.Check({ email: '', password: 'secret' })).toBe(false);
        });

        it('rejects empty password', () => {
            expect(compile.Check({ email: 'test@test.com', password: '' })).toBe(false);
        });

        it('rejects missing fields', () => {
            expect(compile.Check({})).toBe(false);
        });
    });

    describe('CreateOrderBodySchema', () => {
        const compile = TypeCompiler.Compile(CreateOrderBodySchema);

        it('accepts valid order', () => {
            expect(compile.Check({
                items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 2 }],
                total: 198,
            })).toBe(true);
        });

        it('rejects empty items', () => {
            expect(compile.Check({ items: [], total: 0 })).toBe(false);
        });

        it('rejects invalid total', () => {
            expect(compile.Check({
                items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 1 }],
                total: 0,
            })).toBe(false);
        });
    });

    describe('CreateGuestOrderBodySchema', () => {
        const compile = TypeCompiler.Compile(CreateGuestOrderBodySchema);

        it('accepts valid guest order with tableCode', () => {
            expect(compile.Check({
                items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 1 }],
                total: 99,
                tableCode: 'A12',
            })).toBe(true);
        });

        it('accepts guest order without tableCode', () => {
            expect(compile.Check({
                items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 1 }],
                total: 99,
            })).toBe(true);
        });
    });

    describe('UpdateOrderStatusBodySchema', () => {
        const compile = TypeCompiler.Compile(UpdateOrderStatusBodySchema);

        it('accepts valid statuses', () => {
            expect(compile.Check({ status: 'PENDING' })).toBe(true);
            expect(compile.Check({ status: 'CONFIRMED' })).toBe(true);
            expect(compile.Check({ status: 'COMPLETED' })).toBe(true);
        });

        it('rejects invalid status', () => {
            expect(compile.Check({ status: 'INVALID' })).toBe(false);
        });
    });

    describe('RecordPaymentBodySchema', () => {
        const compile = TypeCompiler.Compile(RecordPaymentBodySchema);

        it('accepts valid payment', () => {
            expect(compile.Check({ amount: 199, method: 'CASH' })).toBe(true);
            expect(compile.Check({ amount: 199, method: 'QR', notes: 'test' })).toBe(true);
        });

        it('rejects invalid method', () => {
            expect(compile.Check({ amount: 199, method: 'CARD' })).toBe(false);
        });

        it('rejects zero amount', () => {
            expect(compile.Check({ amount: 0, method: 'CASH' })).toBe(false);
        });
    });

    describe('OrderIdParamSchema', () => {
        const compile = TypeCompiler.Compile(OrderIdParamSchema);

        it('accepts numeric id', () => {
            expect(compile.Check({ id: '123' })).toBe(true);
        });

        it('rejects non-numeric id', () => {
            expect(compile.Check({ id: 'abc' })).toBe(false);
        });
    });
});
