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

export async function pushToPayload(productEN, imageNames) {
  const token = await getPayloadToken()
  console.log('Connecte a Payload')
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
  const res = await axios.post(PAYLOAD_URL + '/api/products', {
    title: productEN.title,
    slug: productEN.slug + "-" + Date.now().toString().slice(-4),
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
    priceInUSDEnabled: false,
    meta: { title: productEN.metaTitle, description: productEN.metaDescription },
    gallery: gallery,
    _status: 'published'
  }, { headers: { Authorization: 'JWT ' + token } })
  console.log('Produit cree: ' + res.data.doc.id)
  return res.data.doc
}
