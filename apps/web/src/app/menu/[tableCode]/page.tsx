import { MenuPage } from '@/features/menu';

export default async function Page({
    params,
}: {
    params: Promise<{ tableCode: string }>;
}) {
    const { tableCode } = await params;
    return <MenuPage tableCode={tableCode} />;
}
