import { describe, it, expect } from 'vitest';
import { getMetrics, incrementOrders, incrementPayments, incrementLogins, incrementFailedLogins } from './metrics';

describe('Metrics', () => {
    it('returns metrics with uptime and counters', () => {
        incrementOrders();
        incrementPayments();
        incrementLogins();
        incrementFailedLogins();
        const m = getMetrics();
        expect(m).toHaveProperty('uptime_seconds');
        expect(m).toHaveProperty('requests_total');
        expect(m).toHaveProperty('orders_created');
        expect(m).toHaveProperty('payments_recorded');
        expect(m).toHaveProperty('logins_total');
        expect(m).toHaveProperty('failed_logins_total');
        expect(typeof m.uptime_seconds).toBe('number');
    });
});
