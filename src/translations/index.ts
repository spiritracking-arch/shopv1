import translationsData from './translations.json'

export const translations: Record<string, Record<string, string>> = {
  en: {
    addToCart: 'Add to Cart',
    outOfStock: 'Out of stock',
    viewCart: 'View Cart',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    shop: 'Shop',
    account: 'Account',
    orders: 'Orders'
  }
}

export function t(key: string): string {
  const locale = process.env.NEXT_PUBLIC_LOCALE || 'en'
  return translations[locale]?.[key] || translations['en']?.[key] || key
}

const uiTranslations: Record<string, Record<string, string>> = translationsData as Record<string, Record<string, string>>

export function tUI(englishText: string): string {
  const locale = process.env.NEXT_PUBLIC_LOCALE || 'en'
  if (locale === 'en') return englishText
  return uiTranslations[locale]?.[englishText] || englishText
}
