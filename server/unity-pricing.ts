import axios from "axios";
import { db } from "./db";
import { unityPricing, unityReserves } from "@shared/schema";
import { desc } from "drizzle-orm";

interface TokenPrices {
  VET: number;
  VTHO: number;
  B3TR: number;
}

interface CirculatingSupply {
  VET: number;
  VTHO: number;
  B3TR: number;
}

interface TokenWeights {
  VET: number;
  VTHO: number;
  B3TR: number;
}

interface UnityPriceResult {
  unityPriceUsd: number;
  tokenPrices: TokenPrices;
  weights: TokenWeights;
  source: string;
}

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

const TOKEN_IDS = {
  VET: "vechain",
  VTHO: "vethor-token",
  B3TR: "vechain-vet",
};

const DEFAULT_CIRCULATING_SUPPLY: CirculatingSupply = {
  VET: 86712634000,
  VTHO: 96000000000,
  B3TR: 100000000,
};

let cachedPrices: TokenPrices | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60000;

/**
 * Scarcity factor based on circulating supply
 * Formula: 1.0 / log10(max(supply, 10))
 */
function scarcityFactor(circulatingSupply: number): number {
  return 1.0 / Math.log10(Math.max(circulatingSupply, 10));
}

/**
 * Utility proxy - assigns utility weight to each token
 * B3TR gets higher weight (1.2x) as platform token
 */
function utilityProxy(token: keyof TokenPrices): number {
  if (token === "B3TR") return 1.2;
  return 1.0;
}

/**
 * Fetch real-time token prices from CoinGecko
 */
async function fetchTokenPrices(): Promise<TokenPrices> {
  const now = Date.now();
  
  if (cachedPrices && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedPrices;
  }

  try {
    const ids = Object.values(TOKEN_IDS).join(",");
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers = apiKey ? { "x-cg-pro-api-key": apiKey } : {};

    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids,
        vs_currencies: "usd",
      },
      headers,
      timeout: 5000,
    });

    const prices: TokenPrices = {
      VET: response.data[TOKEN_IDS.VET]?.usd || 0,
      VTHO: response.data[TOKEN_IDS.VTHO]?.usd || 0,
      B3TR: response.data[TOKEN_IDS.B3TR]?.usd || 0,
    };

    cachedPrices = prices;
    lastFetchTime = now;

    return prices;
  } catch (error) {
    console.error("Error fetching CoinGecko prices:", error);
    
    if (cachedPrices) {
      console.log("Using stale cached prices as fallback");
      return cachedPrices;
    }

    const latestPricing = await db
      .select()
      .from(unityPricing)
      .orderBy(desc(unityPricing.calculatedAt))
      .limit(1);

    if (latestPricing.length > 0) {
      console.log("Using latest database prices as fallback");
      return {
        VET: parseFloat(latestPricing[0].vetPriceUsd),
        VTHO: parseFloat(latestPricing[0].vthoPriceUsd),
        B3TR: parseFloat(latestPricing[0].b3trPriceUsd),
      };
    }

    return { VET: 0.03, VTHO: 0.002, B3TR: 0.05 };
  }
}

/**
 * Compute token weights based on reserves, scarcity, and utility
 */
function computeWeights(
  reserves: { VET: number; VTHO: number; B3TR: number },
  prices: TokenPrices,
  circulatingSupply: CirculatingSupply
): TokenWeights {
  const tokens: (keyof TokenPrices)[] = ["VET", "VTHO", "B3TR"];
  const rawWeights: { [key: string]: number } = {};
  let totalWeight = 0;

  for (const token of tokens) {
    const price = prices[token] || 0;
    const supply = circulatingSupply[token] || 1e9;
    const sf = scarcityFactor(supply);
    const uf = utilityProxy(token);
    const reserveUsd = (reserves[token] || 0) * price;

    const weight = sf * uf * reserveUsd;
    rawWeights[token] = weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) totalWeight = 1;

  return {
    VET: rawWeights.VET / totalWeight,
    VTHO: rawWeights.VTHO / totalWeight,
    B3TR: rawWeights.B3TR / totalWeight,
  };
}

/**
 * Calculate Unity token price in USD
 */
export async function calculateUnityPrice(
  circulatingSupply: CirculatingSupply = DEFAULT_CIRCULATING_SUPPLY
): Promise<UnityPriceResult> {
  const latestReserves = await db
    .select()
    .from(unityReserves)
    .orderBy(desc(unityReserves.snapshotAt))
    .limit(1);

  const reserves = latestReserves.length > 0
    ? {
        VET: parseFloat(latestReserves[0].vetAmount),
        VTHO: parseFloat(latestReserves[0].vthoAmount),
        B3TR: parseFloat(latestReserves[0].b3trAmount),
      }
    : { VET: 0, VTHO: 0, B3TR: 0 };

  const prices = await fetchTokenPrices();

  const weights = computeWeights(reserves, prices, circulatingSupply);

  const unityPriceUsd =
    weights.VET * prices.VET +
    weights.VTHO * prices.VTHO +
    weights.B3TR * prices.B3TR;

  await db.insert(unityPricing).values({
    unityPriceUsd: unityPriceUsd.toFixed(8),
    vetPriceUsd: prices.VET.toFixed(8),
    vthoPriceUsd: prices.VTHO.toFixed(8),
    b3trPriceUsd: prices.B3TR.toFixed(8),
    vetWeight: weights.VET.toFixed(4),
    vthoWeight: weights.VTHO.toFixed(4),
    b3trWeight: weights.B3TR.toFixed(4),
    source: "coingecko",
    metadata: {
      reserves,
      circulatingSupply,
    },
  });

  return {
    unityPriceUsd,
    tokenPrices: prices,
    weights,
    source: "coingecko",
  };
}

/**
 * Get latest Unity price from database (cached)
 */
export async function getLatestUnityPrice(): Promise<UnityPriceResult | null> {
  const latest = await db
    .select()
    .from(unityPricing)
    .orderBy(desc(unityPricing.calculatedAt))
    .limit(1);

  if (latest.length === 0) {
    return await calculateUnityPrice();
  }

  const record = latest[0];
  return {
    unityPriceUsd: parseFloat(record.unityPriceUsd),
    tokenPrices: {
      VET: parseFloat(record.vetPriceUsd),
      VTHO: parseFloat(record.vthoPriceUsd),
      B3TR: parseFloat(record.b3trPriceUsd),
    },
    weights: {
      VET: parseFloat(record.vetWeight),
      VTHO: parseFloat(record.vthoWeight),
      B3TR: parseFloat(record.b3trWeight),
    },
    source: record.source,
  };
}

/**
 * Update reserve snapshot in database
 */
export async function updateReserveSnapshot(
  vetAmount: number,
  vthoAmount: number,
  b3trAmount: number,
  contractAddress?: string
) {
  await db.insert(unityReserves).values({
    vetAmount: vetAmount.toFixed(8),
    vthoAmount: vthoAmount.toFixed(8),
    b3trAmount: b3trAmount.toFixed(8),
    contractAddress,
  });
}
