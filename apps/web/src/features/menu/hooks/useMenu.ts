import { useState, useEffect } from 'react';
import { menuService } from '../services/menu.service';
import { MenuState } from '../types';

export const useMenu = (tableCode: string) => {
    const [state, setState] = useState<MenuState>({
        isLoading: true,
        error: null,
        restaurant: null,
        menu: null,
    });

    useEffect(() => {
        if (!tableCode) return;

        let isMounted = true;

        const fetchMenu = async () => {
            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));
                const data = await menuService.getMenuByTableCode(tableCode);

                if (isMounted) {
                    setState({
                        isLoading: false,
                        error: null,
                        restaurant: data.restaurant,
                        menu: data.menu,
                    });
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        error: 'Failed to load menu. Please scan the QR code again.',
                    }));
                }
            }
        };

        fetchMenu();

        return () => {
            isMounted = false;
        };
    }, [tableCode]);

    return state;
};
