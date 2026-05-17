'use client'
import React from 'react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { AddressItem } from '@/components/addresses/AddressItem'
import { tUI } from '@/translations'

export const AddressListing: React.FC = () => {
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p>{tUI('No addresses found. Please add an address.')}</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-8">
        {addresses.map((address) => (
          <li key={address.id} className="border-b pb-8 last:border-none">
            <AddressItem address={address} />
          </li>
        ))}
      </ul>
    </div>
  )
}
