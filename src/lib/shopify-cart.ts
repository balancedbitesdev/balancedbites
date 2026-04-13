import { shopifyFetch } from "@/lib/shopify";

export const BB_CART_COOKIE = "bb_cart_id";

const CART_FRAGMENT = `
  fragment CartPayload on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

const GET_CART = `
  ${CART_FRAGMENT}
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartPayload
    }
  }
`;

const CART_CREATE = `
  ${CART_FRAGMENT}
  mutation cartCreate {
    cartCreate {
      cart {
        ...CartPayload
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const LINES_ADD = `
  ${CART_FRAGMENT}
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartPayload
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const LINES_UPDATE = `
  ${CART_FRAGMENT}
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartPayload
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const LINES_REMOVE = `
  ${CART_FRAGMENT}
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartPayload
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type CartCost = {
  totalAmount?: { amount: string; currencyCode: string } | null;
  subtotalAmount?: { amount: string; currencyCode: string } | null;
};

export type CartLineMerch = {
  id: string;
  title: string;
  price?: { amount: string; currencyCode: string } | null;
  image?: { url: string; altText: string | null } | null;
  product?: { title: string; handle: string } | null;
};

export type CartLineNode = {
  id: string;
  quantity: number;
  cost?: { totalAmount?: { amount: string; currencyCode: string } | null } | null;
  merchandise?: CartLineMerch | null;
};

export type CartPayload = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost?: CartCost | null;
  lines: {
    edges: { node: CartLineNode }[];
  };
};

function readUserErrors(body: unknown): string[] {
  const errs: string[] = [];
  const b = body as Record<string, unknown>;
  const data = b?.data as Record<string, unknown> | undefined;
  if (!data) return errs;
  for (const key of Object.keys(data)) {
    const payload = data[key] as { userErrors?: { message: string }[] } | null;
    if (payload?.userErrors?.length) {
      for (const e of payload.userErrors) {
        errs.push(e.message);
      }
    }
  }
  return errs;
}

export async function storefrontGetCart(
  cartId: string,
): Promise<CartPayload | null> {
  const res = await shopifyFetch({
    query: GET_CART,
    variables: { cartId },
  });
  if (!("body" in res) || res.body == null) return null;
  const body = res.body as {
    data?: { cart?: CartPayload | null };
    errors?: { message: string }[];
  };
  if (body.errors?.length) return null;
  return body.data?.cart ?? null;
}

export async function storefrontCreateCart(): Promise<CartPayload | null> {
  const res = await shopifyFetch({ query: CART_CREATE });
  if (!("body" in res) || res.body == null) return null;
  const body = res.body as {
    data?: { cartCreate?: { cart?: CartPayload | null } };
    errors?: { message: string }[];
  };
  if (body.errors?.length) return null;
  const errs = readUserErrors(body);
  if (errs.length) return null;
  return body.data?.cartCreate?.cart ?? null;
}

export async function storefrontCartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<{ cart: CartPayload | null; errors: string[] }> {
  const res = await shopifyFetch({
    query: LINES_ADD,
    variables: { cartId, lines },
  });
  if (!("body" in res) || res.body == null) {
    return { cart: null, errors: ["Network error"] };
  }
  const body = res.body as {
    data?: { cartLinesAdd?: { cart?: CartPayload | null } };
    errors?: { message: string }[];
  };
  const gqlErrs = body.errors?.map((e) => e.message) ?? [];
  const userErrs = readUserErrors(body);
  const errors = [...gqlErrs, ...userErrs];
  return {
    cart: body.data?.cartLinesAdd?.cart ?? null,
    errors,
  };
}

export async function storefrontCartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<{ cart: CartPayload | null; errors: string[] }> {
  const res = await shopifyFetch({
    query: LINES_UPDATE,
    variables: { cartId, lines },
  });
  if (!("body" in res) || res.body == null) {
    return { cart: null, errors: ["Network error"] };
  }
  const body = res.body as {
    data?: { cartLinesUpdate?: { cart?: CartPayload | null } };
    errors?: { message: string }[];
  };
  const gqlErrs = body.errors?.map((e) => e.message) ?? [];
  const userErrs = readUserErrors(body);
  return {
    cart: body.data?.cartLinesUpdate?.cart ?? null,
    errors: [...gqlErrs, ...userErrs],
  };
}

export async function storefrontCartLinesRemove(
  cartId: string,
  lineIds: string[],
): Promise<{ cart: CartPayload | null; errors: string[] }> {
  const res = await shopifyFetch({
    query: LINES_REMOVE,
    variables: { cartId, lineIds },
  });
  if (!("body" in res) || res.body == null) {
    return { cart: null, errors: ["Network error"] };
  }
  const body = res.body as {
    data?: { cartLinesRemove?: { cart?: CartPayload | null } };
    errors?: { message: string }[];
  };
  const gqlErrs = body.errors?.map((e) => e.message) ?? [];
  const userErrs = readUserErrors(body);
  return {
    cart: body.data?.cartLinesRemove?.cart ?? null,
    errors: [...gqlErrs, ...userErrs],
  };
}
