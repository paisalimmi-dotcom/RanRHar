'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/features/auth/auth.guard'
import { StaffNav } from '@/features/auth/components/StaffNav'
import { reservationApi, type Reservation } from '@/features/reservation/reservation.api'
import Link from 'next/link'

const STATUS_LABELS: Record<Reservation['status'], string> = {
    PENDING: 'รอการยืนยัน',
    CONFIRMED: 'ยืนยันแล้ว',
    SEATED: 'นั่งแล้ว',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
}

const STATUS_COLORS: Record<Reservation['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    SEATED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
    COMPLETED: 'bg-purple-100 text-purple-800 border-purple-300',
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dateFilter, setDateFilter] = useState<string>(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })
    const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'ALL'>('ALL')

    useEffect(() => {
        loadReservations()
    }, [dateFilter, statusFilter])

    async function loadReservations() {
        try {
            setLoading(true)
            setError(null)
            const data = await reservationApi.getReservations({
                date: dateFilter,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
            })
            setReservations(data)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลการจองได้')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(reservationId: string, newStatus: Reservation['status']) {
        try {
            await reservationApi.updateReservationStatus(reservationId, newStatus)
            await loadReservations()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะได้')
        }
    }

    async function handleCancel(reservationId: string) {
        if (!confirm('คุณต้องการยกเลิกการจองนี้หรือไม่?')) return

        try {
            await reservationApi.cancelReservation(reservationId)
            await loadReservations()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'ไม่สามารถยกเลิกการจองได้')
        }
    }

    const filteredReservations = reservations.filter(r => {
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
        return true
    })

    return (
        <AuthGuard allowedRoles={['manager', 'staff', 'host']}>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                                ← Admin
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">จัดการการจองโต๊ะ</h1>
                        </div>
                        <StaffNav />
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters */}
                    <div className="mb-6 flex gap-4 items-center">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                วันที่
                            </label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สถานะ
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as Reservation['status'] | 'ALL')}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                                <option value="ALL">ทั้งหมด</option>
                                <option value="PENDING">รอการยืนยัน</option>
                                <option value="CONFIRMED">ยืนยันแล้ว</option>
                                <option value="SEATED">นั่งแล้ว</option>
                                <option value="CANCELLED">ยกเลิก</option>
                                <option value="COMPLETED">เสร็จสิ้น</option>
                            </select>
                        </div>
                        <div className="flex-1" />
                        <button
                            onClick={loadReservations}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {loading && filteredReservations.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <p className="text-gray-500 text-center">กำลังโหลด...</p>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500 text-lg mb-2">ไม่มีข้อมูลการจอง</p>
                            <p className="text-gray-400 text-sm">ลูกค้าสามารถจองโต๊ะผ่านระบบได้</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            เลขที่จอง
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            โต๊ะ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            ลูกค้า
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            วันที่/เวลา
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            จำนวนคน
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            สถานะ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            การจัดการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredReservations.map((reservation) => (
                                        <tr key={reservation.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{reservation.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium text-sm">
                                                    {reservation.tableCode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <div className="font-semibold">{reservation.customerName}</div>
                                                {reservation.customerPhone && (
                                                    <div className="text-xs text-gray-500">{reservation.customerPhone}</div>
                                                )}
                                                {reservation.customerEmail && (
                                                    <div className="text-xs text-gray-500">{reservation.customerEmail}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div>{new Date(reservation.reservationDate).toLocaleDateString('th-TH')}</div>
                                                <div className="text-xs text-gray-500">{reservation.reservationTime}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {reservation.partySize} คน
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={reservation.status}
                                                    onChange={(e) => handleStatusChange(reservation.id, e.target.value as Reservation['status'])}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[reservation.status]} cursor-pointer`}
                                                >
                                                    <option value="PENDING">รอการยืนยัน</option>
                                                    <option value="CONFIRMED">ยืนยันแล้ว</option>
                                                    <option value="SEATED">นั่งแล้ว</option>
                                                    <option value="CANCELLED">ยกเลิก</option>
                                                    <option value="COMPLETED">เสร็จสิ้น</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => handleCancel(reservation.id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    )
}
