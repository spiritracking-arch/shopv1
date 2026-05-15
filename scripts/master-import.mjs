import axios from 'axios'
import sharp from 'sharp'
import fsSync from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { reformulateEN } from './reformulate-en.mjs'
import { translateForClone, EU_LANGUAGES } from './translate-clone.mjs'
import { pushToPayload } from './push-to-payload.mjs'
import { pushToClone } from './push-to-clone.mjs'
config()

const CJ_EMAIL = process.env.CJ_EMAIL
const CJ_API_KEY = process.env.CJ_API_KEY

async function getCJToken() {
  const res = await axios.post('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    email: CJ_EMAIL, password: CJ_API_KEY
  })
  return res.data.data.accessToken
}

async function downloadImage(url, filename) {
  const dir = path.resolve('public/media/imports')
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  await sharp(Buffer.from(res.data))
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .withMetadata(false)
    .toFile(path.join(dir, filename + '.webp'))
  return filename
}

export async function importAndPush(keyword, langs = ['fr']) {
  console.log('Recherche CJ: ' + keyword)
  const token = await getCJToken()

  const listRes = await axios.get('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
    headers: { 'CJ-Access-Token': token },
    params: { productNameEn: keyword, pageNum: 1, pageSize: 1 }
  })
  const product = listRes.data.data.list[0]

  const detailRes = await axios.get('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
    headers: { 'CJ-Access-Token': token },
    params: { pid: product.pid }
  })
  const imageSet = detailRes.data.data.productImageSet || [product.productImage]

  console.log('Reformulation EN...')
  const productEN = await reformulateEN(product)

  console.log('Traitement images...')
  const imageNames = []
  for (let i = 0; i < Math.min(imageSet.length, 6); i++) {
    const name = productEN.slug + '-' + (i + 1)
    await downloadImage(imageSet[i], name)
    imageNames.push(name)
  }

  console.log('Push shop mere EN...')
  const doc = await pushToPayload(productEN, imageNames)
  console.log('Produit EN cree: ' + doc.id)

  console.log('Traduction et push clones...')
  for (const langCode of langs) {
    const translation = await translateForClone({ ...productEN, category: product.categoryName }, langCode)
    console.log(langCode + ': ' + translation.title)
    await pushToClone(langCode, productEN, translation, imageNames)
  }

  console.log('Import complet!')
  return { productEN, doc }
}

const result = await importAndPush('silver ring', ['fr'])
console.log('Produit: ' + result.doc.id)
