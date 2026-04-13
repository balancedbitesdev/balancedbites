import { customerAccountDiscoveryHost } from "@/lib/customer-account-oauth";

type CustomerAccountApiDiscovery = {
  graphql_api?: string;
};

export type AccountOrderRow = {
  id: string;
  number: string;
  when: string | null;
  totalLabel: string;
};

export type AccountDashboardData = {
  displayName: string | null;
  email: string | null;
  orders: AccountOrderRow[];
};

const DASHBOARD_QUERY = `
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
    return {
      id,
      number,
      when: n?.processedAt ?? null,
      totalLabel,
    };
  });

  return { displayName, email, orders };
}

export async function fetchAccountDashboardData(
  accessToken: string,
): Promise<AccountDashboardData | null> {
  const endpoint = await discoverGraphqlEndpoint();
  if (endpoint == null) return null;

  const full = await postCustomerGraphql(endpoint, accessToken, DASHBOARD_QUERY);
  const parsedFull = full != null ? parseCustomerAndOrders(full) : null;
  if (parsedFull != null) return parsedFull;

  const minimal = await postCustomerGraphql(endpoint, accessToken, MINIMAL_QUERY);
  const parsedMinimal = minimal != null ? parseCustomerAndOrders(minimal) : null;
  if (parsedMinimal == null) return null;

  return { ...parsedMinimal, orders: [] };
}
