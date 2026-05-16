import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import fs from 'fs'

config()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const texts = [
  "Account settings", "Address", "Addresses", "Cart", "Category",
  "Check your email", "Checkout", "Close", "Confirming Order", "Contact",
  "Create Account", "Dashboard", "Find my order", "Forgot Password",
  "Items", "Log in", "More pages", "My account", "Next", "Next slide",
  "No addresses found.", "No products found. Please try different filters.",
  "Oh no!", "Order Date", "Orders", "Out of stock", "Payment", "Previous",
  "Previous slide", "Processing your payment...", "Recent Orders",
  "Related Products", "Request submitted", "Shipping Address", "Status",
  "Subtotal", "This field is required", "This item is no longer available.",
  "This page could not be found.", "Total", "Welcome to your dashboard!",
  "You have no orders.", "Your cart", "Your cart is empty.",
  "Enter your email to checkout as a guest.",
  "Check your email for a link that will allow you to securely reset your password.",
  "No addresses found. Please add an address.", "Designed in Michigan",
  "Loading, please wait..."
]

const langs = ['fr','de','es','it','pt','nl','ro','cs','hu','sv','da','fi','sk','bg','hr','el','lt','lv','sl','et','mt','ga']

// Découper en batches de 5 langues
const BATCH_SIZE = 5
const batches = []
for (let i = 0; i < langs.length; i += BATCH_SIZE) {
  batches.push(langs.slice(i, i + BATCH_SIZE))
}

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
      console.log(`  🔄 Tentative ${attempt}/3...`)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: 'You are a JSON API. Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation.',
        messages: [{
          role: 'user',
          content: `Translate these ${texts.length} e-commerce UI texts into: ${batchLangs.join(', ')}.

Return ONLY this JSON structure:
{
  "${batchLangs[0]}": {
    "Account settings": "translation here",
    ...all ${texts.length} texts...
  },
  "${batchLangs[1]}": { ... }
}

Rules:
- Every key must appear exactly ONCE per language
- No duplicate keys
- Valid JSON only

Texts: ${JSON.stringify(texts)}`
        }]
      })

      const raw = response.content[0].text
      console.log(`  📥 ${raw.length} chars reçus`)

      const jsonStr = extractJSON(raw)
      const result = JSON.parse(jsonStr)

      // Validation
      const missing = batchLangs.filter(l => !result[l])
      if (missing.length > 0) throw new Error(`Langues manquantes: ${missing.join(', ')}`)

      const counts = batchLangs.map(l => `${l}:${Object.keys(result[l]).length}`)
      console.log(`  ✅ Clés par langue: ${counts.join(', ')}`)

      return result

    } catch (err) {
      console.error(`  ❌ Tentative ${attempt} échouée:`, err.message)
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, 3000))
    }
  }
}

// Traiter tous les batches et fusionner
const allTranslations = {}

for (let i = 0; i < batches.length; i++) {
  const batchResult = await translateBatch(batches[i], i + 1)
  Object.assign(allTranslations, batchResult)
  // Petite pause entre batches
  if (i < batches.length - 1) await new Promise(r => setTimeout(r, 1000))
}

// Vérification finale
console.log(`\n📊 Résumé final:`)
for (const lang of langs) {
  const count = allTranslations[lang] ? Object.keys(allTranslations[lang]).length : 0
  const status = count === texts.length ? '✅' : `⚠️  (${count}/${texts.length})`
  console.log(`  ${lang}: ${status}`)
}

fs.writeFileSync('/root/my-shop/src/translations/translations.json', JSON.stringify(allTranslations, null, 2))
console.log('\n✅ translations.json généré!')
