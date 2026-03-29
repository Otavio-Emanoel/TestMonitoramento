export type Exchange = "Kucoin" | "BingX" | "Bitget" | "Gate.io" | "MEXC"

export type OpportunityType = "SPOT - FUTURO" | "FUTURO - FUTURO"

export interface ArbitrageOpportunity {
  id: string
  symbol: string
  type: OpportunityType
  buyExchange: Exchange
  buyPrice: number
  buyVolume: string
  buyFundingRate?: number
  sellExchange: Exchange
  sellPrice: number
  sellVolume: string
  sellFundingRate?: number
  spreadEntry: number
  spreadExit: number
  inverted: number
  updatedAt: string
}

export interface SpreadHistoryEntry {
  time: string
  value: number
}

export interface FundingRateEntry {
  time: string
  date: string
  buyRate: number | null
  sellRate: number | null
  difference: number
}

export interface FilterProfile {
  id: string
  name: string
  isActive: boolean
}

export interface FilterState {
  profiles: FilterProfile[]
  activeProfileId: string
  coins: string[]
  blacklist: string[]
  buyExchanges: Exchange[]
  sellExchanges: Exchange[]
  spotFuturo: boolean
  futuroFuturo: boolean
}
