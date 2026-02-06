import { useCartContext } from '../CartProvider';

export function useCart() {
    return useCartContext();
}
