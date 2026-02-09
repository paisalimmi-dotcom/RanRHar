'use client';

interface TableWarningBannerProps {
    currentTable: string;
    lastOrderTable: string;
}

export function TableWarningBanner({ currentTable, lastOrderTable }: TableWarningBannerProps) {
    return (
        <div
            style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}
        >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                    คุณเคยสั่งอาหารจากโต๊ะ {lastOrderTable}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    ตอนนี้คุณอยู่ที่โต๊ะ {currentTable}
                </div>
            </div>
        </div>
    );
}
