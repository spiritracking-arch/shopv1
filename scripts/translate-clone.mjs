import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const EU_LANGUAGES = {
  fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ro: 'Romanian',
  cs: 'Czech', hu: 'Hungarian', sv: 'Swedish', da: 'Danish',
  fi: 'Finnish', sk: 'Slovak', bg: 'Bulgarian', hr: 'Croatian',
  el: 'Greek', lt: 'Lithuanian', lv: 'Latvian', sl: 'Slovenian',
  et: 'Estonian', mt: 'Maltese', ga: 'Irish'
}

export async function translateForClone(productEN, langCode) {
  const langName = EU_LANGUAGES[langCode]
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a professional e-commerce copywriter specialized in ${langName}. Translate and reformulate this product for a ${langName}-speaking audience. Make it natural, compelling and culturally adapted. NOT a literal translation. IMPORTANT: Return ONLY a valid JSON object. Do not use single quotes inside strings, use only double quotes. Escape any special characters. Fields: title, metaTitle, description, metaDescription, slug, imageAlt. Product: Title: ${productEN.title} Description: ${productEN.description} Category: ${productEN.category}`
    }]
  })
  const clean = response.content[0].text.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch(e) {
    const fixed = clean.replace(/'/g, "\\'")
    return JSON.parse(fixed)
  }
}
