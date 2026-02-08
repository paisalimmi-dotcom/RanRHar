// Simple in-memory metrics for observability
const metrics = {
    requestsTotal: 0,
    ordersCreated: 0,
    paymentsRecorded: 0,
    loginsTotal: 0,
    failedLoginsTotal: 0,
    startTime: Date.now(),
};

export function incrementRequests(): void {
    metrics.requestsTotal++;
}

export function incrementOrders(): void {
    metrics.ordersCreated++;
}

export function incrementPayments(): void {
    metrics.paymentsRecorded++;
}

export function incrementLogins(): void {
    metrics.loginsTotal++;
}

export function incrementFailedLogins(): void {
    metrics.failedLoginsTotal++;
}

export function getMetrics(): Record<string, unknown> {
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    return {
        uptime_seconds: uptime,
        requests_total: metrics.requestsTotal,
        orders_created: metrics.ordersCreated,
        payments_recorded: metrics.paymentsRecorded,
        logins_total: metrics.loginsTotal,
        failed_logins_total: metrics.failedLoginsTotal,
    };
}
