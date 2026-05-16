import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import fs from 'fs'

config()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const newTexts = [
  "Name", "Email address", "New password", "Confirm password",
  "Change Password", "Update Account", "Processing",
  "cancel", "click here", "Save", "Add address",
  "No addresses found. Please add an address.",
  "Dashboard", "Welcome to your dashboard!",
  "View all orders", "All rights reserved.",
  "Log in to your account", "Password",
  "Add to cart", "View cart", "My account",
  "Search", "Home", "Back", "Submit"
]

const langs = ['fr','de','es','it','pt','nl','ro','cs','hu','sv','da','fi','sk','bg','hr','el','lt','lv','sl','et','mt','ga']
const BATCH_SIZE = 5
const batches = []
for (let i = 0; i < langs.length; i += BATCH_SIZE) batches.push(langs.slice(i, i + BATCH_SIZE))

function extractJSON(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Aucun JSON trouvé')
  return text.slice(start, end + 1)
}

async function translateBatch(batchLangs, batchNum) {
  console.log(`\n🌍 Batch ${batchNum}/${batches.length} : [${batchLangs.join(', ')}]`)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a JSON API. Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation.',
        messages: [{
          role: 'user',
          content: `Translate these e-commerce UI texts into: ${batchLangs.join(', ')}.
Return ONLY this JSON structure:
{ "${batchLangs[0]}": { "Name": "...", ... }, "${batchLangs[1]}": { ... } }
Texts: ${JSON.stringify(newTexts)}`
        }]
      })
      const result = JSON.parse(extractJSON(response.content[0].text))
      const missing = batchLangs.filter(l => !result[l])
      if (missing.length > 0) throw new Error(`Langues manquantes: ${missing.join(', ')}`)
      console.log(`  ✅ OK`)
      return result
    } catch (err) {
      console.error(`  ❌ Tentative ${attempt} échouée:`, err.message)
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, 3000))
    }
  }
}

const existing = JSON.parse(fs.readFileSync('/root/my-shop/src/translations/translations.json', 'utf8'))

for (let i = 0; i < batches.length; i++) {
  const batchResult = await translateBatch(batches[i], i + 1)
  for (const lang of batches[i]) {
    existing[lang] = { ...existing[lang], ...batchResult[lang] }
  }
  if (i < batches.length - 1) await new Promise(r => setTimeout(r, 1000))
}

fs.writeFileSync('/root/my-shop/src/translations/translations.json', JSON.stringify(existing, null, 2))
console.log(`\n✅ translations.json mis à jour! Total clés FR: ${Object.keys(existing['fr']).length}`)
