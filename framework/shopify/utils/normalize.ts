import {
  Product as ShopifyProduct,
  Checkout,
  CheckoutLineItemEdge,
  SelectedOption,
  ImageConnection,
  ProductVariantConnection,
  ProductOption,
  MoneyV2,
} from '@framework/schema'

import type { Cart, LineItem } from '../types'

const money = ({ amount, currencyCode }: MoneyV2) => {
  return {
    value: +amount,
    currencyCode,
  }
}

const normalizeProductOption = ({
  name: displayName,
  values,
  ...rest
}: ProductOption) => {
  return {
    __typename: 'MultipleChoiceOption',
    displayName,
    values: values.map((value) => ({
      label: value,
      hexColors: displayName === 'Color' ? [value] : null,
    })),
    ...rest,
  }
}

const normalizeProductImages = ({ edges }: ImageConnection) =>
  edges?.map(({ node: { originalSrc: url, ...rest } }) => ({
    url,
    ...rest,
  }))

const normalizeProductVariants = ({ edges }: ProductVariantConnection) => {
  console.log(edges)
  return edges?.map(({ node: { id, selectedOptions } }) => ({
    id,
    options: selectedOptions.map(({ name, value }: SelectedOption) =>
      normalizeProductOption({
        id,
        name,
        values: [value],
      })
    ),
  }))
}

export function normalizeProduct(productNode: ShopifyProduct): any {
  const {
    id,
    title: name,
    vendor,
    images,
    variants,
    description,
    handle,
    priceRange,
    options,
    ...rest
  } = productNode

  const product = {
    id,
    name,
    vendor,
    description,
    path: `/${handle}`,
    slug: handle?.replace(/^\/+|\/+$/g, ''),
    price: money(priceRange?.minVariantPrice),
    images: normalizeProductImages(images),
    variants: variants ? normalizeProductVariants(variants) : null,
    options: options ? options.map((o) => normalizeProductOption(o)) : [],
    ...rest,
  }

  return product
}

export function normalizeCart(checkout: Checkout): Cart {
  return {
    id: checkout.id,
    customerId: '',
    email: '',
    createdAt: checkout.createdAt,
    currency: {
      code: checkout.totalPriceV2?.currencyCode,
    },
    taxesIncluded: checkout.taxesIncluded,
    lineItems: checkout.lineItems?.edges.map(normalizeLineItem),
    lineItemsSubtotalPrice: checkout.subtotalPriceV2?.amount,
    subtotalPrice: checkout.subtotalPriceV2?.amount,
    totalPrice: checkout.totalPriceV2?.amount,
    discounts: [],
  }
}

function normalizeLineItem({
  node: { id, title, variant, quantity },
}: CheckoutLineItemEdge): LineItem {
  return {
    id,
    variantId: String(variant?.id),
    productId: String(variant?.id),
    name: `${title}`,
    quantity,
    variant: {
      id: String(variant?.id),
      sku: variant?.sku ?? '',
      name: variant?.title!,
      image: {
        url: variant?.image?.originalSrc,
      },
      requiresShipping: variant?.requiresShipping ?? false,
      price: variant?.priceV2?.amount,
      listPrice: variant?.compareAtPriceV2?.amount,
    },
    path: '',
    discounts: [],
    options: [
      {
        value: variant?.title,
      },
    ],
  }
}
