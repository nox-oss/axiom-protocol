/**
 * SOLPRISM Stats API — Cached endpoint
 * 
 * Caches getProgramAccounts results to avoid rate limiting.
 * Cache TTL: 60 seconds
 */

import { NextResponse } from "next/server";
import { fetchTractionStats, type TractionStats } from "@/lib/solprism";

// In-memory cache
let cachedStats: TractionStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
  const now = Date.now();
  
  // Return cached data if fresh
  if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...cachedStats,
      cached: true,
      cacheAge: Math.round((now - cacheTimestamp) / 1000),
    });
  }
  
  try {
    // Fetch fresh stats
    const stats = await fetchTractionStats();
    
    // Update cache
    cachedStats = stats;
    cacheTimestamp = now;
    
    return NextResponse.json({
      ...stats,
      cached: false,
      cacheAge: 0,
    });
  } catch (error: any) {
    // If fetch fails but we have stale cache, return it
    if (cachedStats) {
      return NextResponse.json({
        ...cachedStats,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
        stale: true,
        error: error.message,
      });
    }
    
    // No cache and fetch failed
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// Revalidate every 60 seconds at the edge
export const revalidate = 60;
