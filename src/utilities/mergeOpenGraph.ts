import type { Metadata } from 'next'

const LOCALE = 'en'
const BRAND = LOCALE === 'en' ? 'ZoJewel' : LOCALE.toUpperCase()

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: '',
  images: [],
  siteName: BRAND,
  title: BRAND,
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    siteName: BRAND,
    images: og?.images ? og.images : [],
  }
}
