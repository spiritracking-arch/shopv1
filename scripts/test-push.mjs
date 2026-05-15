import { pushToPayload } from './push-to-payload.mjs'

try {
  const result = await pushToPayload({
    title: 'Velvet Pouch Test Description 2',
    metaTitle: 'Velvet Jewelry Pouch SEO',
    metaDescription: 'Shop our velvet pouch.',
    description: 'Keep your precious jewelry safe with this premium velvet pouch. Perfect for travel and gifting.',
    slug: 'velvet-pouch-desc-test-2'
  }, ['velvet-pouch-1', 'velvet-pouch-2', 'velvet-pouch-3'])
  console.log('Succes:', result.id)
} catch(e) {
  console.log('ERREUR:', JSON.stringify(e.response?.data, null, 2))
}
