import { MeiliSearch } from 'meilisearch'

const MEILI_HOST = process.env.MEILI_HOST || 'http://127.0.0.1:7700'
const MEILI_API_KEY = process.env.MEILI_API_KEY || ''
const INDEX_PRODUCTS = process.env.MEILI_PRODUCTS_INDEX || 'products'

let client: MeiliSearch | null = null

function getClient() {
  if (!client) {
    client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY })
  }
  return client
}

export async function ensureProductsIndex() {
  const c = getClient()
  const index = await c.getIndex(INDEX_PRODUCTS).catch(async () => {
    return c.createIndex(INDEX_PRODUCTS, { primaryKey: 'id' })
  })
  // set searchable/filters facets
  try {
    await index.updateSettings({
      searchableAttributes: ['name', 'description', 'category.name'],
      filterableAttributes: ['status', 'category.id', 'category.name', 'farmer.id'],
      sortableAttributes: ['price', 'createdAt', 'stockQty']
    })
  } catch {}
}

export type ProductDoc = {
  id: string
  name: string
  description?: string | null
  price: number
  unit: string
  stockQty: number
  status: string
  featured?: boolean
  images?: string[] | null
  imageUrl?: string | null
  category?: { id: string; name: string } | null
  farmer?: { id: string; name?: string | null } | null
  createdAt?: string
}

export async function indexProduct(p: ProductDoc) {
  const c = getClient()
  const index = c.index(INDEX_PRODUCTS)
  await ensureProductsIndex()
  // Only index approved products
  if (p.status !== 'APPROVED') return
  await index.addDocuments([{ ...p, createdAt: p.createdAt || new Date().toISOString() }])
}

export async function updateProductDoc(p: ProductDoc) {
  const c = getClient()
  const index = c.index(INDEX_PRODUCTS)
  await ensureProductsIndex()
  if (p.status === 'APPROVED') {
    await index.addDocuments([{ ...p, createdAt: p.createdAt || new Date().toISOString() }])
  } else {
    // remove if no longer approved
    try { await index.deleteDocument(p.id) } catch {}
  }
}

export async function deleteProductDoc(id: string) {
  const c = getClient()
  const index = c.index(INDEX_PRODUCTS)
  try { await index.deleteDocument(id) } catch {}
}

export async function searchProducts(query: string, filters?: { categoryId?: string; farmerId?: string; minPrice?: number; maxPrice?: number; }) {
  const c = getClient()
  const index = c.index(INDEX_PRODUCTS)
  const filterParts: string[] = []
  if (filters?.categoryId) filterParts.push(`category.id = ${JSON.stringify(filters.categoryId)}`)
  if (filters?.farmerId) filterParts.push(`farmer.id = ${JSON.stringify(filters.farmerId)}`)
  // price facets via numeric filter simulation not supported directly; use sort and client-side range in MVP
  const filter = filterParts.length ? filterParts.join(' AND ') : undefined
  const res = await index.search<ProductDoc>(query, { filter, limit: 20 })
  return res
}
