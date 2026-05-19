import re

filepath = '/root/my-shop/src/app/(app)/products/[slug]/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

insert = """
  // Charger les variantes séparément
  if (product.enableVariants) {
    const payload = await getPayload({ config: configPromise })
    const variantsResult = await payload.find({
      collection: 'variants',
      overrideAccess: true,
      pagination: false,
      where: { product: { equals: product.id } },
      depth: 2,
    })
    ;(product as any).variants = { docs: variantsResult.docs }
  }
"""

old = "  if (!product) return notFound()\n\n  const gallery"
new = "  if (!product) return notFound()\n" + insert + "\n  const gallery"

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)
    print("OK - variantes ajoutees avec succes")
else:
    print("ERREUR - texte cible introuvable, verifiez le fichier")
