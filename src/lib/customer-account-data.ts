import { customerAccountDiscoveryHost } from "@/lib/customer-account-oauth";

type CustomerAccountApiDiscovery = {
  graphql_api?: string;
};

export type AccountOrderLineItem = {
  variantId: string | null;
  quantity: number;
  title: string;
  variantTitle: string | null;
};

export type AccountOrderRow = {
  id: string;
  number: string;
  when: string | null;
  totalLabel: string;
  lineItems: AccountOrderLineItem[];
};

export type AccountDashboardData = {
  displayName: string | null;
  email: string | null;
  orders: AccountOrderRow[];
};

// Preferred query: includes line items with variantId so we can support "Order again".
const DASHBOARD_WITH_LINES_QUERY = `
  query AccountDashboard {
    customer {
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      orders(first: 8, reverse: true) {
        edges {
          node {
            id
            number
            processedAt
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: 50) {
              nodes {
                title
                quantity
                variantId
                variantTitle
              }
            }
          }
        }
      }
    }
  }
`;

// Fallback if the storefront's Customer Account API version predates the line-item fields we want.
const DASHBOARD_QUERY = `
  query AccountDashboardNoLines {
    customer {
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      orders(first: 8, reverse: true) {
        edges {
          node {
            id
            number
            processedAt
            totalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

async function discoverGraphqlEndpoint(): Promise<string | null> {
  const host = customerAccountDiscoveryHost();
  if (host == null) return null;
  const res = await fetch(`https://${host}/.well-known/customer-account-api`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as CustomerAccountApiDiscovery;
  return json.graphql_api ?? null;
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

async function postCustomerGraphql(
  endpoint: string,
  accessToken: string,
  query: string,
): Promise<unknown> {
  const attempts = accessToken.startsWith("Bearer ")
    ? [accessToken]
    : [`Bearer ${accessToken}`, accessToken];

  for (const authorization of attempts) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) continue;
    const json = (await res.json()) as { errors?: { message: string }[] };
    if (json.errors != null && json.errors.length > 0) continue;
    return json;
  }
  return null;
}

const MINIMAL_QUERY = `
  query AccountProfile {
    customer {
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
`;

function parseCustomerAndOrders(raw: unknown): AccountDashboardData | null {
  const body = raw as {
    errors?: { message: string }[];
    data?: {
      customer?: {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        emailAddress?: { emailAddress?: string | null } | null;
        orders?: {
          edges?: Array<{
            node?: {
              id?: string;
              number?: number | string;
              processedAt?: string | null;
              totalPrice?: { amount?: string; currencyCode?: string } | null;
              lineItems?: {
                nodes?: Array<{
                  title?: string | null;
                  quantity?: number | null;
                  variantId?: string | null;
                  variantTitle?: string | null;
                }>;
              } | null;
            };
          }>;
        } | null;
      } | null;
    };
  };

  if (body.errors != null && body.errors.length > 0) {
    return null;
  }

  const c = body.data?.customer;
  if (c == null) return null;

  const email = c.emailAddress?.emailAddress ?? null;
  const displayName =
    c.displayName?.trim() ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const edges = c.orders?.edges ?? [];
  const orders: AccountOrderRow[] = edges.map((e, i) => {
    const n = e.node;
    const id = n?.id ?? `row-${i}`;
    const number = String(n?.number ?? "—");
    const tp = n?.totalPrice;
    const totalLabel =
      tp?.amount != null && tp.currencyCode != null
        ? formatMoney(tp.amount, tp.currencyCode)
        : "—";

    const rawLines = n?.lineItems?.nodes ?? [];
    const lineItems: AccountOrderLineItem[] = rawLines
      .map((li) => ({
        variantId:
          li?.variantId != null && li.variantId.length > 0
            ? String(li.variantId)
            : null,
        quantity:
          typeof li?.quantity === "number" && li.quantity > 0
            ? Math.floor(li.quantity)
            : 1,
        title: String(li?.title ?? "").trim(),
        variantTitle:
          li?.variantTitle != null && li.variantTitle.length > 0
            ? String(li.variantTitle)
            : null,
      }))
      .filter((li) => li.title.length > 0);

    return {
      id,
      number,
      when: n?.processedAt ?? null,
      totalLabel,
      lineItems,
    };
  });

  return { displayName, email, orders };
}

export async function fetchAccountDashboardData(
  accessToken: string,
): Promise<AccountDashboardData | null> {
  const endpoint = await discoverGraphqlEndpoint();
  if (endpoint == null) return null;

  const full = await postCustomerGraphql(
    endpoint,
    accessToken,
    DASHBOARD_WITH_LINES_QUERY,
  );
  const parsedFull = full != null ? parseCustomerAndOrders(full) : null;
  if (parsedFull != null) return parsedFull;

  const withoutLines = await postCustomerGraphql(
    endpoint,
    accessToken,
    DASHBOARD_QUERY,
  );
  const parsedWithoutLines =
    withoutLines != null ? parseCustomerAndOrders(withoutLines) : null;
  if (parsedWithoutLines != null) return parsedWithoutLines;

  const minimal = await postCustomerGraphql(endpoint, accessToken, MINIMAL_QUERY);
  const parsedMinimal = minimal != null ? parseCustomerAndOrders(minimal) : null;
  if (parsedMinimal == null) return null;

  return { ...parsedMinimal, orders: [] };
}
