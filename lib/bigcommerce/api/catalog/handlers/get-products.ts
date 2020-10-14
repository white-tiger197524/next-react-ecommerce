import getAllProducts, {
  Products,
  Product,
} from '../../operations/get-all-products'
import type { ProductsHandlers } from '../products'

const SORT: { [key: string]: string | undefined } = {
  latest: 'date_modified',
  trending: 'total_sold',
  price: 'price',
}

// Return current cart info
const getProducts: ProductsHandlers['getProducts'] = async ({
  res,
  body: { search, category, brand, sort },
  config,
}) => {
  // Use a dummy base as we only care about the relative path
  const url = new URL('/v3/catalog/products', 'http://a')

  // The limit should math the number of products returned by `getAllProducts`
  url.searchParams.set('limit', '10')

  if (search) url.searchParams.set('keyword', search)

  if (category && Number.isInteger(Number(category)))
    url.searchParams.set('categories:in', category)

  if (brand && Number.isInteger(Number(brand)))
    url.searchParams.set('brand_id', brand)

  if (sort) {
    const [_sort, direction] = sort.split('-')
    const sortValue = SORT[_sort]

    if (sortValue && direction) {
      url.searchParams.set('sort', sortValue)
      url.searchParams.set('direction', direction)
    }
  }

  // We only want the id of each product
  url.searchParams.set('include_fields', 'id,price')

  const { data } = await config.storeApiFetch<{ data: { id: number }[] }>(
    url.pathname + url.search
  )
  const entityIds = data.map((p) => p.id)
  const found = entityIds.length > 0
  // We want the GraphQL version of each product
  const graphqlData = await getAllProducts({ variables: { entityIds } })
  // Put the products in an object that we can use to get them by id
  const productsById = graphqlData.products.reduce<{ [k: number]: Product }>(
    (prods, p) => {
      prods[p.node.entityId] = p
      return prods
    },
    {}
  )
  const products: Products = []

  // Populate the products array with the graphql products, in the order
  // assigned by the list of entity ids
  entityIds.forEach((id) => {
    const product = productsById[id]
    if (product) products.push(product)
  })

  res.status(200).json({ data: { products, found } })
}

export default getProducts
