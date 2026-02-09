'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
}

export function ImageUpload({ value, onChange, label = 'รูปภาพ', className = '' }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
            return;
        }

        setUploading(true);

        try {
            // Option 1: Convert to base64 (for demo/local storage)
            const base64 = await fileToBase64(file);
            setPreview(base64);
            onChange(base64);

            // Option 2: Upload to external service (if available)
            // For now, we'll use base64 as a placeholder
            // In production, you would upload to Cloudinary, AWS S3, etc.
            // const uploadedUrl = await uploadToService(file);
            // setPreview(uploadedUrl);
            // onChange(uploadedUrl);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('ไม่สามารถอัปโหลดรูปภาพได้');
        } finally {
            setUploading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleRemove = () => {
        setPreview(null);
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={className}>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
            <div className="flex gap-2 items-start">
                {/* Preview */}
                <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => {
                                    // If preview fails, try to use value as URL
                                    if (value && !value.startsWith('data:')) {
                                        setPreview(value);
                                    } else {
                                        setPreview(null);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                title="ลบรูป"
                            >
                                ×
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            ไม่มีรูป
                        </div>
                    )}
                </div>

                {/* Input Group */}
                <div className="flex-1 min-w-0">
                    <div className="flex gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleClick}
                            disabled={uploading}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'กำลังอัปโหลด...' : 'เลือกรูป'}
                        </button>
                        <input
                            type="url"
                            placeholder="หรือใส่ URL รูปภาพ"
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                if (e.target.value) {
                                    setPreview(e.target.value);
                                } else {
                                    setPreview(null);
                                }
                            }}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        รองรับไฟล์รูปภาพ (JPG, PNG, GIF) ขนาดไม่เกิน 5MB หรือใส่ URL
                    </p>
                </div>
            </div>
        </div>
    );
}
