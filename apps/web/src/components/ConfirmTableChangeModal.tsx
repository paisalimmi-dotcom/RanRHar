'use client';

interface ConfirmTableChangeModalProps {
    isOpen: boolean;
    currentTable: string;
    lastOrderTable: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmTableChangeModal({
    isOpen,
    currentTable,
    lastOrderTable,
    onConfirm,
    onCancel,
}: ConfirmTableChangeModalProps) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '32px', marginBottom: '16px', textAlign: 'center' }}>
                    ⚠️
                </div>
                <h2
                    style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        marginBottom: '12px',
                        textAlign: 'center',
                    }}
                >
                    ยืนยันการสั่งอาหาร
                </h2>
                <p
                    style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '24px',
                        textAlign: 'center',
                        lineHeight: '1.6',
                    }}
                >
                    คุณกำลังสั่งอาหารไปที่ <strong>โต๊ะ {currentTable}</strong>
                    <br />
                    แต่คุณเคยสั่งอาหารจาก <strong>โต๊ะ {lastOrderTable}</strong>
                    <br />
                    <br />
                    คุณต้องการสั่งไปที่โต๊ะ {currentTable} จริงหรือไม่?
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                    }}
                >
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#f5f5f5',
                            color: '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
}
