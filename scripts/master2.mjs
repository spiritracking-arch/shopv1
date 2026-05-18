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

const CLONE_QUALITY = {
  fr:81, de:83, es:85, it:82, pt:84, nl:86,
  ro:81, cs:83, hu:85, sv:82, da:84, fi:86,
  sk:81, bg:83, hr:85, el:82, lt:84, lv:86,
  sl:81, et:83, mt:85, ga:82,
}

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

async function reprocessForClone(imageName, lang) {
  const dir = path.resolve('public/media/imports')
  const src = path.join(dir, imageName + '.webp')
  const dst = path.join(dir, imageName + '-' + lang + '.webp')
  await sharp(src)
    .webp({ quality: CLONE_QUALITY[lang] ?? 82 })
    .toFile(dst)
  return imageName + '-' + lang
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
  // Prix : moyenne des prix suggérés des variantes, convertis en centimes EUR
  const variants = detailRes.data.data.variants || []
  // Taux de change live USD -> EUR
  let eurRate = 0.92 // fallback
  try {
    const rateRes = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    eurRate = rateRes.data.rates.EUR || 0.92
    console.log('Taux EUR/USD live:', eurRate)
  } catch(e) {
    console.log('Taux fixe utilisé:', eurRate)
  }
  let priceEUR = 0
  if (variants.length > 0) {
    const avgPrice = variants.reduce((sum, v) => sum + (v.variantSugSellPrice || 0), 0) / variants.length
    priceEUR = Math.round(avgPrice * eurRate * 100)
  } else {
    priceEUR = Math.round((product.sellPrice || 15) * eurRate * 100)
  }
  console.log('Prix EUR (centimes):', priceEUR)
  const doc = await pushToPayload(productEN, imageNames, priceEUR, variants)
  console.log('Produit EN cree: ' + doc.id)

  console.log('Traduction et push clones...')
  for (const langCode of langs) {
    const translation = await translateForClone({ ...productEN, category: product.categoryName }, langCode)
    console.log(langCode + ': ' + translation.title)
    const cloneImages = await Promise.all(imageNames.map(n => reprocessForClone(n, langCode)))
    await pushToClone(langCode, productEN, translation, cloneImages)
  }

  console.log('Import complet!')
  return { productEN, doc }
}

const result = await importAndPush('silver ring', ['fr'])
console.log('Produit: ' + result.doc.id)

export async function importByPID(pid, langs = ['fr'], categorySlug = null) {
  console.log('Import CJ PID: ' + pid)
  const token = await getCJToken()
  const detailRes = await axios.get('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
    headers: { 'CJ-Access-Token': token },
    params: { pid }
  })
  const product = detailRes.data.data
  const imageSet = product.productImageSet || [product.productImage]
  console.log('Produit CJ: ' + product.productNameEn)
  console.log('Reformulation EN...')
  const productEN = await reformulateEN(product)
  console.log('Traitement images...')
  const imageNames = []
  for (let i = 0; i < Math.min(imageSet.length, 6); i++) {
    const name = productEN.slug + '-' + (i + 1)
    await downloadImage(imageSet[i], name)
    imageNames.push(name)
  }
  const variants = product.variants || []
  let priceEUR = 0
  try {
    const rateRes = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    const eurRate = rateRes.data.rates.EUR || 0.86
    if (variants.length > 0) {
      const avgPrice = variants.reduce((sum, v) => sum + (v.variantSugSellPrice || 0), 0) / variants.length
      priceEUR = Math.round(avgPrice * eurRate * 100)
    } else {
      priceEUR = Math.round((product.sellPrice || 15) * eurRate * 100)
    }
    console.log('Taux EUR live:', eurRate, '→ Prix:', priceEUR, '¢')
  } catch(e) {
    priceEUR = Math.round((product.sellPrice || 15) * 0.86 * 100)
  }
  console.log('Push shop mere EN...')
  const doc = await pushToPayload(productEN, imageNames, priceEUR, variants, categorySlug)
  console.log('Produit EN cree: ' + doc.id)
  console.log('Traduction et push clones...')
  for (const langCode of langs) {
    const translation = await translateForClone({ ...productEN, category: product.categoryName }, langCode)
    console.log(langCode + ': ' + translation.title)
    await pushToClone(doc.id, translation, imageNames, langCode)
  }
  console.log('Import complet!')
  return { productEN, doc }
}
