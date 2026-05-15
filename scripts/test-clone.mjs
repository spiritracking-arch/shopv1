import { pushToClone } from './push-to-clone.mjs'

const productEN = { title: 'Velvet Pouch', slug: 'velvet-pouch' }
const translationFR = {
  title: 'Pochette Velours Luxe',
  slug: 'pochette-velours-luxe',
  description: 'Protégez vos bijoux avec cette pochette en velours.',
  metaTitle: 'Pochette Bijoux Velours',
  metaDescription: 'Pochette velours pour bijoux.'
}

await pushToClone('fr', productEN, translationFR, ['velvet-pouch-1', 'velvet-pouch-2'])
console.log('Done!')
