export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function reformulateAliexpress(title: string, price: number) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a professional e-commerce copywriter.
Reformulate this AliExpress product listing in English. Make it compelling, SEO-friendly and professional.
The title and meta title MUST be different from each other.
Return ONLY a valid JSON object with these fields:
- title (catchy product name, max 60 chars)
- metaTitle (SEO optimized, different from title, max 60 chars)
- description (2-3 sentences, marketing tone)
- metaDescription (max 160 chars, incitative)
- slug (URL-friendly, lowercase, hyphens only, max 50 chars)
Product name: ${title}
Price: ${price} EUR`
    }]
  })
  const text = response.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    proto.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks)
          await sharp(buffer).resize(800, 800, { fit: 'inside' }).webp({ quality: 85 }).toFile(destPath)
          resolve()
        } catch(e) { reject(e) }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

export async function POST(req: NextRequest) {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: configPromise })
    // Accepter aussi Authorization header depuis l'extension Chrome
    const authHeader = req.headers.get('authorization')
    let finalHeaders = headers
    if (authHeader) {
      const { Headers } = await import('next/dist/compiled/@edge-runtime/primitives')
      const h = new Headers(headers)
      h.set('authorization', authHeader)
      finalHeaders = h
    }
    const { user } = await payload.auth({ headers: finalHeaders })
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, price, images, variants, sourceUrl } = body

    if (!title || !images?.length) {
      return NextResponse.json({ error: 'Missing title or images' }, { status: 400 })
    }

    // 1. Reformuler via Claude
    const productEN = await reformulateAliexpress(title, price || 0)

    // 2. Télécharger et compresser les images
    const mediaDir = path.resolve('public/media')
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true })

    const imageIds: number[] = []
    for (let i = 0; i < Math.min(images.length, 6); i++) {
      const filename = productEN.slug + '-' + (i + 1) + '.webp'
      const destPath = path.join(mediaDir, filename)
      try {
        await downloadImage(images[i], destPath)
        const media = await payload.create({
          collection: 'media',
          data: {
            alt: productEN.title + ' ' + (i + 1),
            filename,
            mimeType: 'image/webp',
            filesize: fs.statSync(destPath).size,
            width: 800,
            height: 800,
          },
          filePath: destPath,
        })
        imageIds.push(media.id)
      } catch(e) {
        console.error('Image error:', e)
      }
    }

    // 3. Créer le produit dans Payload
    const gallery = imageIds.map(id => ({ image: id }))

    const doc = await payload.create({
      collection: 'products',
      data: {
        title: productEN.title,
        description: {
          root: {
            type: 'root',
            children: [{
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', text: productEN.description, version: 1 }]
            }],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          }
        },
        gallery,
        slug: productEN.slug + '-' + Date.now().toString(36).slice(-4),
        meta: {
          title: productEN.metaTitle,
          description: productEN.metaDescription,
        },
        priceInUSD: Math.round(price * 100),
        enableVariants: variants?.length > 0,
        _status: 'published',
      } as any,
    })

    // Créer les variantes AliExpress
    if (variants?.length > 0 && doc.id) {
      const productId = doc.id
      const token = req.headers.get('authorization')?.replace('JWT ', '') || ''
      const variantTypeIds: number[] = []

      for (const variantGroup of variants) {
        const typeName = variantGroup.name.toLowerCase().replace(/\s+/g, '_')
        const typeLabel = variantGroup.name

        // Créer ou récupérer le variantType
        const vtRes = await fetch('http://localhost:3000/api/variantTypes?where[name][equals]=' + typeName, {
          headers: { Authorization: 'JWT ' + token }
        })
        const vtData = await vtRes.json()
        let typeId: number

        if (vtData.totalDocs > 0) {
          typeId = vtData.docs[0].id
        } else {
          const vtCreate = await fetch('http://localhost:3000/api/variantTypes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'JWT ' + token },
            body: JSON.stringify({ name: typeName, label: typeLabel })
          })
          const vtCreated = await vtCreate.json()
          typeId = vtCreated.doc.id
        }
        variantTypeIds.push(typeId)

        // Créer les options pour ce type
        const optionIds: number[] = []
        for (const optionLabel of variantGroup.options) {
          const optCreate = await fetch('http://localhost:3000/api/variantOptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'JWT ' + token },
            body: JSON.stringify({
              value: productId + '-' + optionLabel.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
              label: optionLabel,
              variantType: typeId
            })
          })
          const optCreated = await optCreate.json()
          optionIds.push(optCreated.doc.id)
        }

        // Créer une variante pour chaque option (simplifié — une variante par option de couleur/taille)
        for (let i = 0; i < optionIds.length; i++) {
          await fetch('http://localhost:3000/api/variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'JWT ' + token },
            body: JSON.stringify({
              title: productEN.title + ' — ' + variantGroup.options[i],
              product: productId,
              options: [optionIds[i]],
              priceInUSD: price * 100,
              inventory: 99,
              _status: 'published',
            })
          })
        }
      }

      // Mettre à jour le produit avec les variantTypes
      await fetch('http://localhost:3000/api/products/' + productId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'JWT ' + token },
        body: JSON.stringify({ variantTypes: variantTypeIds })
      })
    }

    return NextResponse.json({ 
      success: true, 
      productId: doc.id,
      slug: (doc as any).slug,
      title: productEN.title,
      adminUrl: '/admin/collections/products/' + doc.id
    })

  } catch (e: any) {
    console.error('Import error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
