import MenuPage from "@/features/menu/components/MenuPage";

export default function Page({
    params,
}: {
    params: { tableCode: string };
}) {
    return <MenuPage tableCode={params.tableCode} />;
}
