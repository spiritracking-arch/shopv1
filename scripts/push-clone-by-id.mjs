import { config } from 'dotenv'
import axios from 'axios'
import { translateForClone } from './translate-clone.mjs'
import { pushToClone } from './push-to-clone.mjs'
config()

const PAYLOAD_URL = 'http://localhost:3000'

async function getToken() {
  const res = await axios.post(PAYLOAD_URL + '/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD
  })
  return res.data.token
}

export async function pushToCloneById(productId, langs) {
  console.log(`🚀 Push produit ${productId} vers: ${langs.join(', ')}`)
  
  const token = await getToken()
  
  // Récupérer le produit EN depuis Payload
  const res = await axios.get(`${PAYLOAD_URL}/api/products/${productId}?depth=2`, {
    headers: { Authorization: 'JWT ' + token }
  })
  const product = res.data

  // Récupérer les noms d'images depuis la galerie
  const imageNames = (product.gallery || [])
    .filter(g => typeof g.image === 'object')
    .map(g => g.image.filename?.replace('.webp', ''))
    .filter(Boolean)

  console.log('Images:', imageNames)

  const productEN = {
    sourceId: productId,
    title: product.title,
    slug: product.slug.replace(/-\d{4}$/, ''),
    description: product.description?.root?.children?.[0]?.children?.[0]?.text || '',
    metaTitle: product.meta?.title || product.title,
    metaDescription: product.meta?.description || '',
    priceInUSD: product.priceInUSD || 0,
    enableVariants: product.enableVariants || false,
  }

  let variants = []
  if (product.enableVariants) {
    const varRes = await axios.get(PAYLOAD_URL + "/api/variants?where[product][equals]=" + productId + "&limit=100&depth=2", {
      headers: { Authorization: "JWT " + token }
    })
    variants = varRes.data.docs || []
  }

  for (const langCode of langs) {
    try {
      console.log("  📦 Traduction " + langCode + "...")
      const translation = await translateForClone(productEN, langCode)
      console.log("  → " + translation.title)
      await pushToClone(langCode, productEN, translation, imageNames, variants)
      console.log("  ✅ " + langCode + " OK")
    } catch(e) {
      console.error("  ❌ " + langCode + ": " + e.message)
    }
  }
  console.log('✅ Push terminé!')
}
