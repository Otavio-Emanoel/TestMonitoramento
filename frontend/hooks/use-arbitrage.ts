"use client"

import useSWR from "swr"
import { mockOpportunities, generateSpreadHistory, generateFundingRates } from "@/lib/mock-data"
import type { ArbitrageOpportunity, FilterState, Exchange } from "@/lib/types"

const ALL_EXCHANGES: Exchange[] = ["Kucoin", "BingX", "Bitget", "Gate.io", "MEXC"]

// Mock API fetcher - substituir por sua API real
async function fetchArbitrage(): Promise<ArbitrageOpportunity[]> {
  // Simula delay de API
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  // Retorna dados mockados com pequenas variações para simular atualizações em tempo real
  return mockOpportunities.map((opp) => ({
    ...opp,
    spreadEntry: opp.spreadEntry + (Math.random() - 0.5) * 0.1,
    spreadExit: opp.spreadExit + (Math.random() - 0.5) * 0.1,
    updatedAt: new Date().toISOString(),
  }))
}

const defaultFilters: FilterState = {
  profiles: [{ id: "1", name: "Padrão", isActive: true }],
  activeProfileId: "1",
  coins: [],
  blacklist: [],
  buyExchanges: ALL_EXCHANGES,
  sellExchanges: ALL_EXCHANGES,
  spotFuturo: false,
  futuroFuturo: false,
}

export function useArbitrage(filters: FilterState = defaultFilters, isPaused = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isPaused ? null : "arbitrage",
    fetchArbitrage,
    {
      refreshInterval: 10000, // 10 segundos
      revalidateOnFocus: false,
    }
  )

  // Aplica filtros
  const filteredData = data?.filter((opp) => {
    // Filtro por moedas
    if (filters.coins.length > 0 && !filters.coins.includes(opp.symbol)) {
      return false
    }
    
    // Filtro por blacklist
    if (filters.blacklist.includes(opp.symbol)) {
      return false
    }
    
    // Filtro por exchanges de compra
    if (filters.buyExchanges.length > 0 && !filters.buyExchanges.includes(opp.buyExchange)) {
      return false
    }
    
    // Filtro por exchanges de venda
    if (filters.sellExchanges.length > 0 && !filters.sellExchanges.includes(opp.sellExchange)) {
      return false
    }
    
    // Filtro por tipo de oportunidade
    if (filters.spotFuturo && opp.type !== "SPOT - FUTURO") {
      return false
    }
    
    if (filters.futuroFuturo && opp.type !== "FUTURO - FUTURO") {
      return false
    }
    
    return true
  })

  return {
    opportunities: filteredData || [],
    isLoading,
    error,
    refresh: mutate,
    lastUpdate: data ? new Date().toLocaleTimeString("pt-BR") : null,
  }
}

export function useSpreadHistory(opportunityId: string, type: "entry" | "exit") {
  const { data } = useSWR(
    `spread-history-${opportunityId}-${type}`,
    () => Promise.resolve(generateSpreadHistory(type)),
    { revalidateOnFocus: false }
  )

  if (!data) return { data: [], max: 0, min: 0, avg: 0 }

  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  return {
    data,
    max: Number(max.toFixed(2)),
    min: Number(min.toFixed(2)),
    avg: Number(avg.toFixed(2)),
  }
}

export function useFundingRates(opportunityId: string) {
  const { data } = useSWR(
    `funding-rates-${opportunityId}`,
    () => Promise.resolve(generateFundingRates()),
    { revalidateOnFocus: false }
  )

  return {
    data: data || [],
    buyCycle: "4h",
    sellCycle: "4h",
  }
}
