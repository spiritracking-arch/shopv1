import sharp from 'sharp'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

config()

const CJ_API_KEY = process.env.CJ_API_KEY
const CJ_EMAIL = process.env.CJ_EMAIL

async function getCJToken() {
  const res = await axios.post('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    email: CJ_EMAIL,
    password: CJ_API_KEY
  })
  return res.data.data.accessToken
}

async function searchProducts(token, keyword) {
  const res = await axios.get('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
    headers: { 'CJ-Access-Token': token },
    params: { productNameEn: keyword, pageNum: 1, pageSize: 10 }
  })
  return res.data.data.list
}

async function processImage(url, filename) {
  const dir = path.resolve('public/media/imports')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const res = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(res.data)

  await sharp(buffer)
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .withMetadata(false)
    .toFile(path.join(dir, `${filename}.webp`))

  console.log(`✅ Image traitée : ${filename}.webp`)
}

async function main() {
  const token = await getCJToken()
  console.log('✅ Connecté à CJ')

  const products = await searchProducts(token, 'jewelry')
  console.log(`✅ ${products.length} produits trouvés`)
  console.log(products[0])

  if (products[0]?.productImage) {
    await processImage(products[0].productImage, 'test-product')
  }
}

main().catch(console.error)
