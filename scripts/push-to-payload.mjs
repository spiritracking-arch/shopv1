import axios from 'axios'
import { config } from 'dotenv'
import fsSync from 'fs'
import path from 'path'
import FormData from 'form-data'
config()

const PAYLOAD_URL = 'http://localhost:3000'

async function getPayloadToken() {
  const res = await axios.post(PAYLOAD_URL + '/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD
  })
  return res.data.token
}

async function imageExists(token, filename) {
  const res = await axios.get(PAYLOAD_URL + '/api/media?where[filename][equals]=' + filename + '.webp', {
    headers: { Authorization: 'JWT ' + token }
  })
  return res.data.totalDocs > 0 ? res.data.docs[0].id : null
}

async function uploadImage(token, imagePath, alt) {
  const form = new FormData()
  form.append('file', fsSync.createReadStream(imagePath), { contentType: 'image/webp' })
  form.append('_payload', JSON.stringify({ alt }), { contentType: 'application/json' })
  const res = await axios.post(PAYLOAD_URL + '/api/media', form, {
    headers: { ...form.getHeaders(), Authorization: 'JWT ' + token }
  })
  return res.data.doc.id
}

async function getOrCreateVariantType(token, name, label) {
  // Chercher si existe déjà
  const res = await axios.get(PAYLOAD_URL + '/api/variantTypes?where[name][equals]=' + name, {
    headers: { Authorization: 'JWT ' + token }
  })
  if (res.data.totalDocs > 0) return res.data.docs[0].id

  // Créer
  const create = await axios.post(PAYLOAD_URL + '/api/variantTypes', { name, label }, {
    headers: { Authorization: 'JWT ' + token }
  })
  return create.data.doc.id
}

async function createVariantOption(token, value, label, variantTypeId) {
  // Toujours créer une nouvelle option unique
  const create = await axios.post(PAYLOAD_URL + '/api/variantOptions', {
    value: value + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
    label,
    variantType: variantTypeId
  }, { headers: { Authorization: 'JWT ' + token } })
  return create.data.doc.id
}

function parseVariantKey(variantKey) {
  // "White-6" → {color: "White", size: "6"}
  // "6" → {size: "6"}
  // "White" → {color: "White"}
  const parts = variantKey.split('-')
  const result = {}
  for (const part of parts) {
    if (!isNaN(part) || part.match(/^\d+[\.,]?\d*$/)) {
      result.size = part
    } else {
      result.color = part
    }
  }
  return result
}

export async function pushToPayload(productEN, imageNames, priceEUR = 1500, cjVariants = [], categorySlug = null) {
  const token = await getPayloadToken()
  console.log('Connecte a Payload')

  // Récupérer l'ID de la catégorie si fournie
  let categoryId = null
  if (categorySlug) {
    const catRes = await axios.get(PAYLOAD_URL + '/api/categories?where[slug][equals]=' + categorySlug, {
      headers: { Authorization: 'JWT ' + token }
    })
    if (catRes.data.totalDocs > 0) {
      categoryId = catRes.data.docs[0].id
      console.log('Catégorie trouvée: ' + categoryId)
    }
  }

  // Vérifier si le produit existe déjà
  const existingCheck = await axios.get(
    PAYLOAD_URL + '/api/products?where[slug][contains]=' + productEN.slug + '&limit=1',
    { headers: { Authorization: 'JWT ' + token } }
  )
  if (existingCheck.data.totalDocs > 0) {
    console.log('⚠️  Produit déjà existant, skip: ' + productEN.slug)
    return existingCheck.data.docs[0]
  }

  // Upload images
  const imgs = Array.isArray(imageNames) ? imageNames : [imageNames || productEN.slug]
  const gallery = []
  for (let i = 0; i < imgs.length; i++) {
    const imagePath = path.resolve('public/media/imports/' + imgs[i] + '.webp')
    if (fsSync.existsSync(imagePath)) {
      const filename = imgs[i]
      const existingId = await imageExists(token, filename)
      if (existingId) {
        gallery.push({ image: existingId })
        console.log('Image deja existante: ' + existingId)
        continue
      }
      const mediaId = await uploadImage(token, imagePath, productEN.title + ' ' + (i + 1))
      gallery.push({ image: mediaId })
      console.log('Image uploadee: ' + mediaId)
    }
  }

  const hasVariants = cjVariants.length > 0

  // Créer le produit
  const res = await axios.post(PAYLOAD_URL + '/api/products', {
    title: productEN.title,
    slug: productEN.slug + '-' + Date.now().toString().slice(-4),
    description: {
      root: {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{ type: 'text', text: productEN.description, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
          direction: 'ltr', format: '', indent: 0, textFormat: 0, version: 1
        }],
        direction: 'ltr', format: '', indent: 0, version: 1
      }
    },
    priceInUSDEnabled: !hasVariants,
    priceInUSD: hasVariants ? 0 : priceEUR,
    enableVariants: hasVariants,
    inventory: hasVariants ? 0 : 99,
    meta: { title: productEN.metaTitle, description: productEN.metaDescription },
    gallery: gallery,
    categories: categoryId ? [categoryId] : [],
    _status: 'published'
  }, { headers: { Authorization: 'JWT ' + token } })

  const productId = res.data.doc.id
  console.log('Produit cree: ' + productId)

  // Créer les variantes
  if (hasVariants) {
    console.log('Création variantes...')

    // Analyser les types de variantes présents
    const parsed = cjVariants.map(v => ({ ...parseVariantKey(v.variantKey), cj: v }))
    const hasColor = parsed.some(p => p.color)
    const hasSize = parsed.some(p => p.size)

    // Créer variantTypes
    let colorTypeId = null
    let sizeTypeId = null
    if (hasColor) colorTypeId = await getOrCreateVariantType(token, 'color', 'Color')
    if (hasSize) sizeTypeId = await getOrCreateVariantType(token, 'size', 'Size')

    // Créer chaque variante
    for (const p of parsed) {
      const optionIds = []

      if (p.color && colorTypeId) {
        const optId = await createVariantOption(token, productId + '-' + p.color.toLowerCase(), p.color, colorTypeId)
        optionIds.push(optId)
      }
      if (p.size && sizeTypeId) {
        const optId = await createVariantOption(token, productId + '-' + p.size.toLowerCase(), p.size, sizeTypeId)
        optionIds.push(optId)
      }

      // Prix de la variante en EUR
      const variantPrice = Math.round((p.cj.variantSugSellPrice || 15) * 0.86 * 100)

      await axios.post(PAYLOAD_URL + '/api/variants', {
        title: productEN.title + ' — ' + p.cj.variantKey,
        product: productId,
        options: optionIds,
        priceInUSD: variantPrice,
        inventory: 99,
      }, { headers: { Authorization: 'JWT ' + token } })

      console.log('Variante créée: ' + p.cj.variantKey + ' → ' + variantPrice + '¢')
    }

    // Mettre à jour le produit avec variantTypes
    const variantTypeIds = []
    if (colorTypeId) variantTypeIds.push(colorTypeId)
    if (sizeTypeId) variantTypeIds.push(sizeTypeId)

    await axios.patch(PAYLOAD_URL + '/api/products/' + productId, {
      variantTypes: variantTypeIds,
    }, { headers: { Authorization: 'JWT ' + token } })

    console.log('Variantes configurées sur le produit')
  }

  return res.data.doc
}
