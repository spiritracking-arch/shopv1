import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import axios from 'axios'

config()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getToken() {
  const res = await axios.post('http://localhost:3000/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD,
  })
  return res.data.token
}

const token = await getToken()

// 1. Menu
await axios.post('http://localhost:3000/api/globals/header', {
  navItems: [
    { link: { type: 'custom', url: '/shop', label: 'Shop' } },
    { link: { type: 'custom', url: '/account', label: 'Account' } },
    { link: { type: 'custom', url: '/orders', label: 'Orders' } },
  ]
}, { headers: { Authorization: `JWT ${token}` } })
console.log('✅ Menu configuré')

// 2. Homepage
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 300,
  system: 'You are a copywriter for a jewelry e-commerce store. Respond ONLY with valid JSON.',
  messages: [{
    role: 'user',
    content: `Write homepage hero content in English for a premium jewelry store.
Return ONLY this JSON:
{
  "h1": "catchy headline max 8 words",
  "paragraph": "subtitle max 20 words"
}`
  }]
})

const raw = response.content[0].text
const content = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1))
console.log(`✍️  "${content.h1}"`)

// Vérifier si page home existe
const existing = await axios.get(
  'http://localhost:3000/api/pages?where%5Bslug%5D%5Bequals%5D=home',
  { headers: { Authorization: `JWT ${token}` } }
)

const pageData = {
  slug: 'home',
  title: 'Home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading', tag: 'h1',
            children: [{ type: 'text', text: content.h1, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
            direction: 'ltr', format: '', indent: 0, version: 1,
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', text: content.paragraph, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
            direction: 'ltr', format: '', indent: 0, version: 1,
          },
        ],
        direction: 'ltr', format: '', indent: 0, version: 1,
      }
    },
    links: [],
  },
  layout: [{
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

if (existing.data?.docs?.length > 0) {
  const id = existing.data.docs[0].id
  await axios.patch(`http://localhost:3000/api/pages/${id}`, pageData, {
    headers: { Authorization: `JWT ${token}` }
  })
} else {
  await axios.post('http://localhost:3000/api/pages', pageData, {
    headers: { Authorization: `JWT ${token}` }
  })
}

console.log('✅ Homepage configurée!')
