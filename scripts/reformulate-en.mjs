import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function reformulateEN(product) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a professional e-commerce copywriter.
Reformulate this product listing in English. Make it compelling, SEO-friendly and professional.
The title and meta title MUST be different from each other.
Return ONLY a valid JSON object with these fields:
- title (catchy product name, max 60 chars)
- metaTitle (SEO optimized, different from title, max 60 chars)
- description (2-3 sentences, marketing tone)
- metaDescription (max 160 chars, incitative)
- slug (URL-friendly, lowercase, hyphens only)

Product name: ${product.productNameEn}
Category: ${product.categoryName}
Price: ${product.sellPrice}`
    }]
  })

  const text = response.content[0].text
  const clean = text.replace(/```json|```/g, "").trim(); return JSON.parse(clean)
}

