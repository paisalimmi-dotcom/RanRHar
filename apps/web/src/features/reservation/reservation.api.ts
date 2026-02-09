// Reservation API Adapter

import { apiClient } from '@/lib/api-client';

export interface Reservation {
    id: string;
    tableCode: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED';
    notes?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: number;
    confirmedBy?: number;
    confirmedAt?: string;
}

export interface CreateReservationRequest {
    tableCode: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    notes?: string;
}

export interface GetReservationsResponse {
    reservations: Reservation[];
}

export interface UpdateReservationStatusRequest {
    status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED';
}

export const reservationApi = {
    /**
     * Create a new reservation (public, no auth required)
     */
    async createReservation(data: CreateReservationRequest): Promise<Reservation> {
        return await apiClient.post<Reservation>(
            '/reservations',
            data,
            false // No auth required
        );
    },

    /**
     * Get all reservations (manager/staff/host only)
     */
    async getReservations(params?: {
        date?: string;
        status?: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED';
        tableCode?: string;
    }): Promise<Reservation[]> {
        const queryParams = new URLSearchParams();
        if (params?.date) queryParams.append('date', params.date);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.tableCode) queryParams.append('tableCode', params.tableCode);

        const response = await apiClient.get<GetReservationsResponse>(
            `/reservations?${queryParams.toString()}`,
            true // Auth required
        );

        return response.reservations;
    },

    /**
     * Get single reservation (manager/staff/host only)
     */
    async getReservation(id: string): Promise<Reservation> {
        return await apiClient.get<Reservation>(
            `/reservations/${id}`,
            true // Auth required
        );
    },

    /**
     * Update reservation status (manager/staff/host only)
     */
    async updateReservationStatus(
        id: string,
        status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED'
    ): Promise<{ id: string; status: string; confirmedBy?: number; confirmedAt?: string }> {
        return await apiClient.patch<{ id: string; status: string; confirmedBy?: number; confirmedAt?: string }>(
            `/reservations/${id}/status`,
            { status },
            true // Auth required
        );
    },

    /**
     * Cancel reservation (manager/staff/host only)
     */
    async cancelReservation(id: string): Promise<void> {
        await apiClient.delete(
            `/reservations/${id}`,
            true // Auth required
        );
    },
};
