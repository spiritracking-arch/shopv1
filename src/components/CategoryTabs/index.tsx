import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'
import { Item } from './Item'
import { tUI } from '@/translations'

async function List() {
  const payload = await getPayload({ config: configPromise })
  const categoriesData = await payload.find({
    collection: 'categories',
    sort: 'title',
    select: {
      title: true,
      slug: true,
    },
  })
  const categories = categoriesData.docs?.map((category) => {
    return {
      href: `/shop/${category.slug}`,
      title: category.title,
    }
  })
  return (
    <React.Fragment>
      <nav>
        <ul className="flex gap-3">
          <Item title={tUI('All')} href="/shop" />
          <Suspense fallback={null}>
            {categories.map((category) => {
              return <Item {...category} key={category.href} />
            })}
          </Suspense>
        </ul>
      </nav>
    </React.Fragment>
  )
}
