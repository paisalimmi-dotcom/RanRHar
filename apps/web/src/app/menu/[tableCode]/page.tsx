import MenuPage from '@/features/menu/components/MenuPage';

export default async function Page({
    params,
}: {
    params: Promise<{ tableCode: string }>;
}) {
    const { tableCode } = await params;

    // Server Component: ดึง params ได้
    // แล้วส่งให้ Client Component (MenuPage) ที่ใช้ hooks ได้
    return <MenuPage tableCode={tableCode} />;
}
