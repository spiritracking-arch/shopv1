import axios from 'axios'
import { config } from 'dotenv'
import fsSync from 'fs'
import path from 'path'
import FormData from 'form-data'
import sharp from 'sharp'
config()

const CLONE_URLS = {
  fr: 'http://localhost:3001',
  de: 'http://localhost:3002',
  es: 'http://localhost:3003',
  it: 'http://localhost:3004',
  pt: 'http://localhost:3005',
  nl: 'http://localhost:3006',
  ro: 'http://localhost:3007',
  cs: 'http://localhost:3008',
  hu: 'http://localhost:3009',
  sv: 'http://localhost:3010',
  da: 'http://localhost:3011',
  fi: 'http://localhost:3012',
  sk: 'http://localhost:3013',
  bg: 'http://localhost:3014',
  hr: 'http://localhost:3015',
  el: 'http://localhost:3016',
  lt: 'http://localhost:3017',
  lv: 'http://localhost:3018',
  sl: 'http://localhost:3019',
  et: 'http://localhost:3020',
  mt: 'http://localhost:3021',
  ga: 'http://localhost:3022'
}

async function getToken(url) {
  const res = await axios.post(url + '/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD
  })
  return res.data.token
}

async function processImageForClone(srcPath, destPath, langCode) {
  const crops = { fr: 2, de: 4, es: 6, it: 8, pt: 10, nl: 12, ro: 14, cs: 16, hu: 18, sv: 20, da: 22, fi: 24, sk: 26, bg: 28, hr: 30, el: 32, lt: 34, lv: 36, sl: 38, et: 40, mt: 42, ga: 44 }
  const crop = crops[langCode] || 2
  await sharp(srcPath)
    .resize(800 - crop, 800 - crop, { fit: 'cover' })
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 80 + Math.floor(crop/10) })
    .withMetadata(false)
    .toFile(destPath)
}

async function uploadImageToClone(token, url, imagePath, alt) {
  const form = new FormData()
  form.append('file', fsSync.createReadStream(imagePath), { contentType: 'image/webp' })
  form.append('_payload', JSON.stringify({ alt }), { contentType: 'application/json' })
  const res = await axios.post(url + '/api/media', form, {
    headers: { ...form.getHeaders(), Authorization: 'JWT ' + token }
  })
  return res.data.doc.id
}

export async function pushToClone(langCode, productEN, translation, imageNames, variants = []) {
  const url = CLONE_URLS[langCode]
  if (!url) return console.log('Clone non configure: ' + langCode)

  const token = await getToken(url)
  console.log('Connecte a clone ' + langCode)

  const gallery = []
  const cloneDir = path.resolve('/root/shop-' + langCode + '/public/media/imports')
  if (!fsSync.existsSync(cloneDir)) fsSync.mkdirSync(cloneDir, { recursive: true })

  for (let i = 0; i < imageNames.length; i++) {
    let srcPath = path.resolve('public/media/imports/' + imageNames[i] + '.webp')
    if (!fsSync.existsSync(srcPath)) {
      srcPath = path.resolve('public/media/' + imageNames[i] + '.webp')
    }
    const destName = translation.slug + '-' + (i + 1)
    const destPath = path.join(cloneDir, destName + '.webp')
    await processImageForClone(srcPath, destPath, langCode)
    const mediaId = await uploadImageToClone(token, url, destPath, translation.title + ' ' + (i + 1))
    gallery.push({ image: mediaId })
    console.log('Image clone ' + langCode + ': ' + mediaId)
  }

  const res = await axios.post(url + '/api/products', {
    title: translation.title,
    slug: translation.slug + '-' + Date.now().toString().slice(-4),
    description: {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: translation.description, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }], direction: 'ltr', format: '', indent: 0, textFormat: 0, version: 1 }],
        direction: 'ltr', format: '', indent: 0, version: 1
      }
    },
    priceInUSD: productEN.priceInUSD || 0,
    priceInUSDEnabled: false,
    enableVariants: variants.length > 0,
    meta: { title: translation.metaTitle, description: translation.metaDescription },
    gallery,
    _status: 'published'
  }, { headers: { Authorization: "JWT " + token } })

  const productId = res.data.doc.id
  console.log('Produit ' + langCode + ' cree: ' + productId)

  // Creer les variantes sur le clone
  if (variants.length > 0) {
    const variantTypeMap = {}
    for (const variant of variants) {
      const optionIds = []
      for (const opt of (variant.options || [])) {
        if (!opt || typeof opt !== "object") continue
        const typeName = opt.variantType?.name || "size"
        const typeLabel = opt.variantType?.label || "Size"
        if (!variantTypeMap[typeName]) {
          const vtRes = await axios.get(url + "/api/variantTypes?where[name][equals]=" + typeName, { headers: { Authorization: "JWT " + token } })
          if (vtRes.data.totalDocs > 0) {
            variantTypeMap[typeName] = vtRes.data.docs[0].id
          } else {
            const vtCreate = await axios.post(url + "/api/variantTypes", { name: typeName, label: typeLabel }, { headers: { Authorization: "JWT " + token } })
            variantTypeMap[typeName] = vtCreate.data.doc.id
          }
        }
        const optCreate = await axios.post(url + "/api/variantOptions", {
          value: productId + "-" + opt.label.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36),
          label: opt.label,
          variantType: variantTypeMap[typeName]
        }, { headers: { Authorization: "JWT " + token } })
        optionIds.push(optCreate.data.doc.id)
      }
      await axios.post(url + "/api/variants", {
        title: translation.title + " — " + variant.title?.split(" — ").slice(1).join(" — "),
        product: productId,
        options: optionIds,
        priceInUSD: variant.priceInUSD || productEN.priceInUSD || 0,
        inventory: variant.inventory || 99,
        _status: 'published',
      }, { headers: { Authorization: "JWT " + token } })
    }
    // Mettre a jour le produit avec les variantTypes
    await axios.patch(url + "/api/products/" + productId, {
      variantTypes: Object.values(variantTypeMap)
    }, { headers: { Authorization: "JWT " + token } })
  }

  return res.data.doc
}
