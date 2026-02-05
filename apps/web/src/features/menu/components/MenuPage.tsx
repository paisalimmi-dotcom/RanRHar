"use client";

import { useMenu } from "../hooks/useMenu";

export default function MenuPage({ tableCode }: { tableCode: string }) {
    const { loading, restaurant, categories } = useMenu(tableCode);

    return (
        <main style={{ padding: 24 }}>
            <h1>Menu for table: {tableCode}</h1>

            <section style={{ marginTop: 12 }}>
                <div>
                    <strong>Restaurant:</strong> {restaurant?.name ?? "—"}
                </div>
                <div>
                    <strong>Branch:</strong> {restaurant?.branchName ?? "—"}
                </div>
            </section>

            <section style={{ marginTop: 16 }}>
                {loading ? (
                    <p>Loading menu...</p>
                ) : (
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(categories, null, 2)}
                    </pre>
                )}
            </section>
        </main>
    );
}
