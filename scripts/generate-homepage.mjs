import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import { config } from 'dotenv'
config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LANGUAGES = {
  fr: 'French', de: 'German', es: 'Spanish'
}

async function generateHomepage(langCode, langName) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Create a beautiful, modern e-commerce homepage in ${langName} as a React component.
Requirements:
- Hero section with a catchy headline and subtitle
- Featured products section (3 product cards, fake data)
- Simple footer
- Use inline styles only, no external CSS
- Modern, minimal design
- Colors: unique palette for ${langName} culture
- Return ONLY the JSX code starting with "export default function HomePage()"
- No imports needed except Link from 'next/link'`
    }]
  })

  const code = response.content[0].text
  const dir = '/root/my-shop/previews'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  fs.writeFileSync(dir + '/homepage-' + langCode + '.tsx', code)
  console.log('✅ Page ' + langCode + ' générée')
}

for (const [langCode, langName] of Object.entries(LANGUAGES)) {
  await generateHomepage(langCode, langName)
}
