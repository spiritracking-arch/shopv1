import { tUI } from '@/translations'

export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const getSorting = (): SortFilterItem[] => [
  { slug: null, reverse: false, title: tUI('Alphabetic A-Z') },
  { slug: '-createdAt', reverse: true, title: tUI('Latest arrivals') },
  { slug: 'priceInUSD', reverse: false, title: tUI('Price: Low to high') },
  { slug: '-priceInUSD', reverse: true, title: tUI('Price: High to low') },
]

export const sorting = getSorting()
