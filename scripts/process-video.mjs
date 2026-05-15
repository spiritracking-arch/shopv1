import { exec } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

config()

const execAsync = promisify(exec)

export async function processVideo(url, filename, options = {}) {
  const dir = path.resolve('public/media/imports/videos')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const tmpFile = path.join(dir, `tmp-${filename}.mp4`)
  const outFile = path.join(dir, `${filename}.mp4`)

  const res = await axios.get(url, { responseType: 'arraybuffer' })
  fs.writeFileSync(tmpFile, Buffer.from(res.data))

  const crop = options.crop || 'iw-4:ih-4:2:2'
  await execAsync(`ffmpeg -i ${tmpFile} -vf "crop=${crop}" -map_metadata -1 -c:v libx264 -crf 23 -preset fast -c:a aac ${outFile} -y`)

  fs.unlinkSync(tmpFile)
  console.log(`✅ Vidéo traitée : ${filename}.mp4`)
  return outFile
}

console.log('✅ FFmpeg prêt pour le traitement vidéo')
