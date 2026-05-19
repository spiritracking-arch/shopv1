import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers })

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, langs } = await req.json()

    if (!productId || !langs?.length) {
      return NextResponse.json({ error: 'Missing productId or langs' }, { status: 400 })
    }

    // Lancer le push via spawn pour éviter les problèmes de modules
    const { spawn } = await import('child_process')
    
    const child = spawn('node', [
      '--input-type=module',
      '--eval',
      `
import { pushToCloneById } from '/root/my-shop/scripts/push-clone-by-id.mjs'
pushToCloneById(${productId}, ${JSON.stringify(langs)})
  .then(() => console.log('✅ Push terminé'))
  .catch(e => console.error('❌', e.message))
`
    ], {
      cwd: '/root/my-shop',
      env: { ...process.env },
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref()

    return NextResponse.json({ 
      message: `✅ Push lancé vers ${langs.length} clone(s)! Vérifiez les logs dans 2 minutes.` 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
