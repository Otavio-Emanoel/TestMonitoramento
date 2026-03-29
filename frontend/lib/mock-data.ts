import type { ArbitrageOpportunity, SpreadHistoryEntry, FundingRateEntry } from "./types"

export const mockOpportunities: ArbitrageOpportunity[] = [
  {
    id: "1",
    symbol: "XRP",
    type: "FUTURO - FUTURO",
    buyExchange: "MEXC",
    buyPrice: 1.33,
    buyVolume: "$2.9M",
    buyFundingRate: -0.009,
    sellExchange: "Kucoin",
    sellPrice: 1.34,
    sellVolume: "$0.00",
    sellFundingRate: -0.004,
    spreadEntry: 0.86,
    spreadExit: -1.72,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    symbol: "XRP",
    type: "SPOT - FUTURO",
    buyExchange: "Bitget",
    buyPrice: 1.33,
    buyVolume: "$751.2K",
    sellExchange: "Kucoin",
    sellPrice: 1.34,
    sellVolume: "$0.00",
    sellFundingRate: -0.004,
    spreadEntry: 0.76,
    spreadExit: -1.63,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    symbol: "TRUTH",
    type: "SPOT - FUTURO",
    buyExchange: "MEXC",
    buyPrice: 0.009341,
    buyVolume: "$233.1K",
    sellExchange: "MEXC",
    sellPrice: 0.009383,
    sellVolume: "$219.3K",
    sellFundingRate: 0.012,
    spreadEntry: 0.45,
    spreadExit: -0.79,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    symbol: "TRUTH",
    type: "SPOT - FUTURO",
    buyExchange: "Kucoin",
    buyPrice: 0.009320,
    buyVolume: "$404.8K",
    sellExchange: "MEXC",
    sellPrice: 0.009383,
    sellVolume: "$219.3K",
    sellFundingRate: 0.012,
    spreadEntry: 0.68,
    spreadExit: -0.91,
    inverted: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    symbol: "CFG",
    type: "FUTURO - FUTURO",
    buyExchange: "Bitget",
    buyPrice: 0.161380,
    buyVolume: "$3.7M",
    buyFundingRate: -0.319,
    sellExchange: "Gate.io",
    sellPrice: 0.162190,
    sellVolume: "$847.9K",
    sellFundingRate: -0.178,
    spreadEntry: 0.50,
    spreadExit: -0.77,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    symbol: "CRTR",
    type: "SPOT - FUTURO",
    buyExchange: "Kucoin",
    buyPrice: 0.034570,
    buyVolume: "$216.0K",
    sellExchange: "BingX",
    sellPrice: 0.034860,
    sellVolume: "$720.5K",
    sellFundingRate: 0.009,
    spreadEntry: 0.84,
    spreadExit: -2.00,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    symbol: "CRTR",
    type: "SPOT - FUTURO",
    buyExchange: "MEXC",
    buyPrice: 0.034720,
    buyVolume: "$1.7M",
    sellExchange: "BingX",
    sellPrice: 0.034860,
    sellVolume: "$720.5K",
    sellFundingRate: 0.009,
    spreadEntry: 0.40,
    spreadExit: -1.61,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    symbol: "DOGE",
    type: "SPOT - FUTURO",
    buyExchange: "Kucoin",
    buyPrice: 0.085200,
    buyVolume: "$5.2M",
    sellExchange: "MEXC",
    sellPrice: 0.090268,
    sellVolume: "$3.1M",
    sellFundingRate: 0.015,
    spreadEntry: 5.94,
    spreadExit: -3.21,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    symbol: "SOL",
    type: "FUTURO - FUTURO",
    buyExchange: "Gate.io",
    buyPrice: 142.50,
    buyVolume: "$12.3M",
    buyFundingRate: -0.015,
    sellExchange: "Bitget",
    sellPrice: 143.20,
    sellVolume: "$8.7M",
    sellFundingRate: 0.008,
    spreadEntry: 0.49,
    spreadExit: -0.65,
    inverted: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    symbol: "ETH",
    type: "SPOT - FUTURO",
    buyExchange: "BingX",
    buyPrice: 3450.25,
    buyVolume: "$45.2M",
    sellExchange: "Kucoin",
    sellPrice: 3465.80,
    sellVolume: "$32.1M",
    sellFundingRate: 0.012,
    spreadEntry: 0.45,
    spreadExit: -0.52,
    inverted: 0,
    updatedAt: new Date().toISOString(),
  },
]

export function generateSpreadHistory(type: "entry" | "exit"): SpreadHistoryEntry[] {
  const now = new Date()
  const data: SpreadHistoryEntry[] = []
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hours = time.getHours().toString().padStart(2, "0")
    const minutes = time.getMinutes().toString().padStart(2, "0")
    
    let value: number
    if (type === "entry") {
      // Curva crescente com pico
      const progress = (24 - i) / 24
      value = 0.8 + Math.sin(progress * Math.PI) * 0.6 + Math.random() * 0.1
    } else {
      // Curva suave crescente
      const progress = (24 - i) / 24
      value = 0.02 + progress * 0.13 + Math.random() * 0.02
    }
    
    data.push({
      time: `${hours}:${minutes}`,
      value: Number(value.toFixed(4)),
    })
  }
  
  return data
}

export function generateFundingRates(): FundingRateEntry[] {
  const now = new Date()
  const data: FundingRateEntry[] = []
  
  for (let i = 6; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 4 * 60 * 60 * 1000)
    const hours = time.getHours().toString().padStart(2, "0")
    const minutes = time.getMinutes().toString().padStart(2, "0")
    const day = time.getDate().toString().padStart(2, "0")
    const month = (time.getMonth() + 1).toString().padStart(2, "0")
    const year = time.getFullYear()
    
    const buyRate = Math.random() * 0.02 - 0.01
    const sellRate = Math.random() * 0.02 + 0.005
    
    data.push({
      time: `${hours}:${minutes}`,
      date: `${day}/${month}/${year}`,
      buyRate: i % 2 === 0 ? null : buyRate,
      sellRate: sellRate,
      difference: sellRate - (buyRate || 0),
    })
  }
  
  return data.reverse()
}
