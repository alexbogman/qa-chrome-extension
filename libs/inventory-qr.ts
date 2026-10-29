/** GS1 DataMatrix-style code used by Practice Portal scan (same format as qa-tools). */

export type InventoryFundingFilter = "all" | "private" | "vfc" | "vfa";

export interface InventoryQrItem {
  id: string;
  name: string;
  lot: string;
  expiration: string;
  doses: number;
  fundingType: string;
  saleNdc: string;
  qrCode: string;
}

interface InventoryRow {
  id: string;
  lot: string | null;
  expiration: string | null;
  doses: number;
  fundingType: string | null;
  vfc?: boolean | null;
  vaccine: {
    name: string;
    saleNdc: string | null;
  } | null;
}

const QA_INVENTORY_QUERY = `
  query QaToolsInventoryQr($practiceId: uuid!) {
    inventories(
      where: {
        practiceId: { _eq: $practiceId }
        status: { _eq: received }
        doses: { _gt: 0 }
      }
      order_by: [{ vaccine: { name: asc } }, { expiration: asc }]
      limit: 120
    ) {
      id
      lot
      expiration
      doses
      fundingType
      vfc
      vaccine {
        name
        saleNdc
      }
    }
  }
`;

function modifyNdc(ndc: string): string {
  const cleanNdc = ndc.replace(/-/g, "");

  if (/^0000/.test(cleanNdc)) {
    return cleanNdc.replace(/^0000/, "000") + "0";
  }

  const middleZero = /^(\d{5})0(\d{3})(\d{2})$/;
  if (middleZero.test(cleanNdc)) {
    return cleanNdc.replace(middleZero, "$1$2$3" + "0");
  }

  return cleanNdc;
}

function formatGs1Expiration(expiration: string): string | null {
  const date = new Date(expiration);
  if (Number.isNaN(date.getTime())) return null;

  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function buildInventoryQrCode(
  saleNdc: string,
  expiration: string,
  lot: string,
): string | null {
  const ndc = modifyNdc(saleNdc);
  const exp = formatGs1Expiration(expiration);
  if (!ndc || !exp || !lot) return null;
  return `01003${ndc}17${exp}10${lot}`;
}

export function resolveGraphqlEndpoint(pageUrl: string): string | null {
  try {
    const { hostname, port } = new URL(pageUrl);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (port === "3000" || port === "") {
        return "http://localhost:8080/v1/graphql";
      }
      return null;
    }
    if (hostname === "app-staging.canid.io") {
      return "https://api-staging.canid.io/v1/graphql";
    }
    if (hostname === "app.canid.io") {
      return "https://api.canid.io/v1/graphql";
    }
    return null;
  } catch {
    return null;
  }
}

export function getPracticeHandlerFromUrl(pageUrl: string): string | null {
  try {
    const path = new URL(pageUrl).pathname;
    const segment = path.split("/").filter(Boolean)[0];
    if (!segment || segment === "sign-in" || segment === "login") return null;
    return segment;
  } catch {
    return null;
  }
}

function readAuthToken(handler: string): string | null {
  const key = `canid/${handler}/token`;
  const token = localStorage.getItem(key);
  if (!token || token === "undefined" || token === "") return null;
  return token;
}

function decodePracticeId(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    const id = json?.practice?.id;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function normalizeFundingType(row: InventoryRow): string {
  if (row.fundingType) return row.fundingType.toLowerCase();
  if (row.vfc) return "vfc";
  return "private";
}

function mapInventoryRows(rows: InventoryRow[]): InventoryQrItem[] {
  const items: InventoryQrItem[] = [];

  for (const row of rows) {
    const saleNdc = row.vaccine?.saleNdc?.trim();
    const lot = row.lot?.trim();
    const expiration = row.expiration;
    const name = row.vaccine?.name?.trim();
    if (!saleNdc || !lot || !expiration || !name) continue;

    const qrCode = buildInventoryQrCode(saleNdc, expiration, lot);
    if (!qrCode) continue;

    items.push({
      id: row.id,
      name,
      lot,
      expiration: expiration.slice(0, 10),
      doses: row.doses,
      fundingType: normalizeFundingType(row),
      saleNdc,
      qrCode,
    });
  }

  return items;
}

export async function fetchPracticeInventoryQr(
  pageUrl: string = window.location.href,
): Promise<InventoryQrItem[]> {
  const endpoint = resolveGraphqlEndpoint(pageUrl);
  if (!endpoint) {
    throw new Error("Inventory QR only works on Practice Portal");
  }

  const handler = getPracticeHandlerFromUrl(pageUrl);
  if (!handler) {
    throw new Error("Could not resolve practice handler from URL");
  }

  const token = readAuthToken(handler);
  if (!token) {
    throw new Error("Not signed in — open Practice Portal while logged in");
  }

  const practiceId = decodePracticeId(token);
  if (!practiceId) {
    throw new Error("Could not read practice id from session token");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: QA_INVENTORY_QUERY,
      variables: { practiceId },
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    data?: { inventories?: InventoryRow[] };
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new Error(body.errors[0]?.message ?? "GraphQL error");
  }

  return mapInventoryRows(body.data?.inventories ?? []);
}

export function filterInventoryItems(
  items: InventoryQrItem[],
  query: string,
  funding: InventoryFundingFilter,
): InventoryQrItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (funding !== "all" && item.fundingType !== funding) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.lot.toLowerCase().includes(q) ||
      item.saleNdc.toLowerCase().includes(q) ||
      item.fundingType.toLowerCase().includes(q)
    );
  });
}
