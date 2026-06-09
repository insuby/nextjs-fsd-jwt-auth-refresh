'use client';

import { useRouter } from 'next/navigation';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { RoutesPath } from 'shared/config';
import { Button } from 'shared/ui';

import { addToCartAction } from '../api/add-to-cart-action';

export function AddToCartButton({
  productId,
  userId,
}: {
  productId: number;
  userId: number;
}) {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: () => addToCartAction({ productId, userId }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Added to cart (cart #${result.cart.id}).`);
        router.refresh();
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
      onClick={() => mutate()}
      isLoading={isPending}
      className="w-full px-3 py-1.5"
    >
      Add to cart
    </Button>
  );
}
