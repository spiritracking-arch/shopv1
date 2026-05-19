filepath = '/root/my-shop/src/app/(app)/products/[slug]/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

old = "    ;(product as any).variants = { docs: variantsResult.docs }\n  }"

new = """    ;(product as any).variants = { docs: variantsResult.docs }

    const variantTypesResult = await payload.find({
      collection: 'variantTypes',
      overrideAccess: true,
      pagination: false,
      where: { product: { equals: product.id } },
      depth: 2,
    })
    ;(product as any).variantTypes = variantTypesResult.docs
  }"""

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)
    print("OK - variantTypes ajoutes")
else:
    print("ERREUR - texte cible introuvable")
