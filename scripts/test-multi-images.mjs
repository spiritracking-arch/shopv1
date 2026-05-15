import axios from 'axios'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
config()

async function downloadAndProcess(url, filename) {
  const dir = path.resolve('public/media/imports')
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  await sharp(Buffer.from(res.data))
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .withMetadata(false)
    .toFile(path.join(dir, filename + '.webp'))
  console.log('Image traitee: ' + filename + '.webp')
}

const slug = 'velvet-pouch'
const images = [
  'https://cf.cjdropshipping.com/e1eefddc-bbae-4076-be86-327601ba0eb7.jpg',
  'https://cf.cjdropshipping.com/155c0dab-90e5-463c-aa8a-ffc45e411399.jpg',
  'https://cf.cjdropshipping.com/df17cd30-8259-4844-8bfe-0255cfe40f47.jpg'
]

for (let i = 0; i < images.length; i++) {
  await downloadAndProcess(images[i], slug + '-' + (i + 1))
}
console.log('OK toutes les images traitees')
