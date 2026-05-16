import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import axios from 'axios'

config()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CLONES = {
  fr: { port: 3001, country: 'France', lang: 'français', title: 'Accueil' },
  es: { port: 3002, country: 'Espagne', lang: 'espagnol', title: 'Inicio' },
  de: { port: 3003, country: 'Allemagne', lang: 'allemand', title: 'Startseite' },
  it: { port: 3004, country: 'Italie', lang: 'italien', title: 'Home' },
  pt: { port: 3005, country: 'Portugal', lang: 'portugais', title: 'Início' },
  nl: { port: 3006, country: 'Pays-Bas', lang: 'néerlandais', title: 'Home' },
  ro: { port: 3007, country: 'Roumanie', lang: 'roumain', title: 'Acasă' },
  cs: { port: 3008, country: 'République Tchèque', lang: 'tchèque', title: 'Domů' },
  hu: { port: 3009, country: 'Hongrie', lang: 'hongrois', title: 'Főoldal' },
  sv: { port: 3010, country: 'Suède', lang: 'suédois', title: 'Hem' },
  da: { port: 3011, country: 'Danemark', lang: 'danois', title: 'Hjem' },
  fi: { port: 3012, country: 'Finlande', lang: 'finnois', title: 'Etusivu' },
  sk: { port: 3013, country: 'Slovaquie', lang: 'slovaque', title: 'Domov' },
  bg: { port: 3014, country: 'Bulgarie', lang: 'bulgare', title: 'Начало' },
  hr: { port: 3015, country: 'Croatie', lang: 'croate', title: 'Početna' },
  el: { port: 3016, country: 'Grèce', lang: 'grec', title: 'Αρχική' },
  lt: { port: 3017, country: 'Lituanie', lang: 'lituanien', title: 'Pradžia' },
  lv: { port: 3018, country: 'Lettonie', lang: 'letton', title: 'Sākums' },
  sl: { port: 3019, country: 'Slovénie', lang: 'slovène', title: 'Domov' },
  et: { port: 3020, country: 'Estonie', lang: 'estonien', title: 'Avaleht' },
  mt: { port: 3021, country: 'Malte', lang: 'maltais', title: 'Paġna ewlenija' },
  ga: { port: 3022, country: 'Irlande', lang: 'irlandais', title: 'Baile' },
}

function buildRichText(h1, paragraph) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading', tag: 'h1',
          children: [{ type: 'text', text: h1, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
          direction: 'ltr', format: '', indent: 0, version: 1,
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', text: paragraph, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
          direction: 'ltr', format: '', indent: 0, version: 1,
        },
      ],
      direction: 'ltr', format: '', indent: 0, version: 1,
    }
  }
}

function buildLayout() {
  return [{
    blockType: 'content',
    columns: [{
      size: 'full',
      richText: {
        root: {
          type: 'root',
          children: [{
            type: 'paragraph',
            children: [{ type: 'text', text: ' ', version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
            direction: 'ltr', format: '', indent: 0, version: 1,
          }],
          direction: 'ltr', format: '', indent: 0, version: 1,
        }
      }
    }]
  }]
}

async function generateContent(lang, country, language) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: 'You are a copywriter for a jewelry e-commerce store. Respond ONLY with a valid JSON object, no markdown.',
    messages: [{
      role: 'user',
      content: `Write homepage hero content in ${language} for a jewelry store targeting ${country}.
Return ONLY this JSON:
{
  "h1": "catchy headline max 8 words",
  "paragraph": "subtitle max 20 words mentioning fast delivery to ${country}"
}`
    }]
  })
  const text = response.content[0].text
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
}

async function getToken(port) {
  const res = await axios.post(`http://localhost:${port}/api/users/login`, {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD,
  })
  return res.data.token
}

async function pushHomepage(port, token, content, title) {
  const existing = await axios.get(
    `http://localhost:${port}/api/pages?where%5Bslug%5D%5Bequals%5D=home`,
    { headers: { Authorization: `JWT ${token}` } }
  )

  const pageData = {
    slug: 'home',
    title,
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: buildRichText(content.h1, content.paragraph),
      links: [],
    },
    layout: buildLayout()
  }

  if (existing.data?.docs?.length > 0) {
    const id = existing.data.docs[0].id
    await axios.patch(`http://localhost:${port}/api/pages/${id}`, pageData, {
      headers: { Authorization: `JWT ${token}` }
    })
  } else {
    await axios.post(`http://localhost:${port}/api/pages`, pageData, {
      headers: { Authorization: `JWT ${token}` }
    })
  }
}

for (const [lang, data] of Object.entries(CLONES)) {
  try {
    process.stdout.write(`🌍 ${lang}... `)
    const content = await generateContent(lang, data.country, data.lang)
    process.stdout.write(`"${content.h1}" → `)
    const token = await getToken(data.port)
    await pushHomepage(data.port, token, content, data.title)
    console.log('✅')
    await new Promise(r => setTimeout(r, 500))
  } catch (e) {
    console.log(`❌ ${e.message}`)
  }
}

console.log('\n✅ Homepages générées!')
