import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import React from 'react'
import { tUI } from '@/translations'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <Button
      variant="nav"
      size="clear"
      className="navLink relative items-end hover:cursor-pointer"
      {...rest}
    >
      <span>{tUI('Your cart')}</span>
      {quantity ? (
        <>
          <span>•</span>
          <span>{quantity}</span>
        </>
      ) : null}
    </Button>
  )
}
