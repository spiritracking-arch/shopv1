import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import axios from 'axios'

config()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES_EN = ["Women's jewelry"]

const CLONES = {
  en: { port: 3000 },
  fr: { port: 3001 },
  es: { port: 3002 },
  de: { port: 3003 },
  it: { port: 3004 },
  pt: { port: 3005 },
  nl: { port: 3006 },
  ro: { port: 3007 },
  cs: { port: 3008 },
  hu: { port: 3009 },
  sv: { port: 3010 },
  da: { port: 3011 },
  fi: { port: 3012 },
  sk: { port: 3013 },
  bg: { port: 3014 },
  hr: { port: 3015 },
  el: { port: 3016 },
  lt: { port: 3017 },
  lv: { port: 3018 },
  sl: { port: 3019 },
  et: { port: 3020 },
  mt: { port: 3021 },
  ga: { port: 3022 },
}

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1000,
  system: 'You are a JSON API. Respond with ONLY a valid JSON object.',
  messages: [{
    role: 'user',
    content: `Translate these e-commerce categories into all these languages: fr, es, de, it, pt, nl, ro, cs, hu, sv, da, fi, sk, bg, hr, el, lt, lv, sl, et, mt, ga.
Return ONLY this JSON:
{
  "en": { "Women's jewelry": "Women's jewelry" },
  "fr": { "Women's jewelry": "Bijoux femme" }
}
Categories: ${JSON.stringify(CATEGORIES_EN)}`
  }]
})

const raw = response.content[0].text
const translations = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1))
console.log('✅ Traductions générées')

for (const [lang, data] of Object.entries(CLONES)) {
  try {
    const token = (await axios.post(`http://localhost:${data.port}/api/users/login`, {
      email: process.env.PAYLOAD_ADMIN_EMAIL,
      password: process.env.PAYLOAD_ADMIN_PASSWORD
    })).data.token

    const langTranslations = translations[lang] || translations['en']

    for (const catEN of CATEGORIES_EN) {
      const title = langTranslations[catEN] || catEN
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const existing = await axios.get(
        `http://localhost:${data.port}/api/categories?where[slug][equals]=${slug}`,
        { headers: { Authorization: `JWT ${token}` } }
      )
      if (existing.data.totalDocs > 0) {
        console.log(`⚠️  ${lang}: "${title}" existe déjà`)
        continue
      }

      await axios.post(`http://localhost:${data.port}/api/categories`, {
        title, slug,
      }, { headers: { Authorization: `JWT ${token}` } })

      console.log(`✅ ${lang}: "${title}"`)
    }
  } catch(e) {
    console.log(`❌ ${lang}: ${e.message}`)
  }
}

console.log('\n✅ Catégories créées sur tous les shops!')
