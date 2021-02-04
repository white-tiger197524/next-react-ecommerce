import { Cart } from '@commerce/types'
import { CommerceError, ValidationError } from '@commerce/utils/errors'
import { normalizeCart } from '@framework/lib/normalize'
import { Checkout, Maybe, UserError } from '@framework/schema'

const checkoutToCart = (checkoutResponse?: {
  checkout: Checkout
  userErrors?: UserError[]
}): Maybe<Cart> => {
  if (!checkoutResponse) {
    throw new CommerceError({
      message: 'Missing checkout details from response cart Response',
    })
  }

  const { checkout, userErrors } = checkoutResponse

  if (userErrors && userErrors.length) {
    throw new ValidationError({
      message: userErrors[0].message,
    })
  }

  if (!checkout) {
    throw new ValidationError({
      message: 'Missing checkout details from response cart Response',
    })
  }

  return normalizeCart(checkout)
}

export default checkoutToCart
