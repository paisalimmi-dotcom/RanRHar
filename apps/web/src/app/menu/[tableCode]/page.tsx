import MenuPage from '@/features/menu/components/MenuPage';
import { menuService } from '@/features/menu/services/menu.service';

export default async function Page({
    params,
}: {
    params: Promise<{ tableCode: string }>;
}) {
    const { tableCode } = await params;

    // Server Component: Fetch data
    const initialData = await menuService.getMenuForTable(tableCode);

    return <MenuPage tableCode={tableCode} initialData={initialData} />;
}
