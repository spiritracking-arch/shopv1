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
  es: 'http://localhost:3003'
}

async function getToken(url) {
  const res = await axios.post(url + '/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD
  })
  return res.data.token
}

async function processImageForClone(srcPath, destPath, langCode) {
  const crops = { fr: 2, de: 4, es: 6, it: 8 }
  const crop = crops[langCode] || 2
  await sharp(srcPath)
    .resize(800 - crop, 800 - crop, { fit: 'cover' })
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 80 + crop })
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

export async function pushToClone(langCode, productEN, translation, imageNames) {
  const url = CLONE_URLS[langCode]

  const token = await getToken(url)
  console.log('Connecte a clone ' + langCode)

  const gallery = []
  const cloneDir = path.resolve('/root/shop-' + langCode + '/public/media/imports')

  for (let i = 0; i < imageNames.length; i++) {
    const srcPath = path.resolve('public/media/imports/' + imageNames[i] + '.webp')
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
    priceInUSDEnabled: false,
    meta: { title: translation.metaTitle, description: translation.metaDescription },
    gallery,
    _status: 'published'
  }, { headers: { Authorization: 'JWT ' + token } })

  console.log('Produit ' + langCode + ' cree: ' + res.data.doc.id)
  return res.data.doc
}
