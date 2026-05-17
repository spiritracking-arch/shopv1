'use client'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddressForm } from '@/components/forms/AddressForm'
import { Address } from '@/payload-types'
import { DefaultDocumentIDType } from 'payload'
import { tUI } from '@/translations'

type Props = {
  addressID?: DefaultDocumentIDType
  initialData?: Partial<Omit<Address, 'country'>> & { country?: string }
  buttonText?: string
  modalTitle?: string
  callback?: (address: Partial<Address>) => void
  skipSubmission?: boolean
  disabled?: boolean
}

export const CreateAddressModal: React.FC<Props> = ({
  addressID,
  initialData,
  buttonText,
  modalTitle,
  callback,
  skipSubmission,
  disabled,
}) => {
  const [open, setOpen] = useState(false)

  const defaultButtonText = buttonText || tUI('Add address')
  const defaultModalTitle = modalTitle || tUI('Add address')

  const handleOpenChange = (state: boolean) => setOpen(state)
  const closeModal = () => setOpen(false)
  const handleCallback = (data: Partial<Address>) => {
    closeModal()
    if (callback) callback(data)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        <Button variant={'outline'}>{defaultButtonText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultModalTitle}</DialogTitle>
          <DialogDescription>{tUI('Shipping Address')}</DialogDescription>
        </DialogHeader>
        <AddressForm
          addressID={addressID}
          initialData={initialData}
          callback={handleCallback}
          skipSubmission={skipSubmission}
        />
      </DialogContent>
    </Dialog>
  )
}
