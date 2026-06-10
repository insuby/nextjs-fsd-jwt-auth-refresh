'use client';

import { useRouter } from 'next/navigation';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { RoutesPath } from 'shared/config';
import { Button } from 'shared/ui';

import { addToCartAction } from '../api/add-to-cart-action';

export function AddToCartButton({ productId }: { productId: number }) {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: () => addToCartAction({ productId }),
    onSuccess: (result) => {
      if (result.ok) {
        const { total, totalQuantity, products } = result.cart;
        // No router.refresh() here: it would re-run the dashboard SSR, which
        // re-prefetches only the FIRST products page and re-hydrates over the
        // client infinite query — collapsing the loaded list back to 5. DummyJSON
        // is also stateless (the add is never persisted), so a refresh wouldn't
        // change the "Your carts" summary anyway — we surface the result here.
        toast.success(
          `Added to cart — ${totalQuantity ?? products.length} item(s), $${total.toFixed(2)}`,
        );
        return;
      }
      toast.error(result.message);
      if (result.reason === 'session-expired') {
        router.replace(RoutesPath.LOGIN);
        router.refresh();
      }
    },
    onError: () => toast.error('Add to cart failed. Please try again.'),
  });

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => mutate()}
      isLoading={isPending}
      className="w-full"
    >
      {isPending ? 'Adding…' : 'Add to cart'}
    </Button>
  );
}
