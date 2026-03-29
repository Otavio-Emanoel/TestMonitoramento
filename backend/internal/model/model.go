package model

// MarketType distinguishes between spot and perpetual futures markets.
type MarketType string

const (
	Spot    MarketType = "spot"
	Futures MarketType = "futures"
)

// NormalizedTicker is the unified in-memory representation of a ticker
// regardless of which exchange or format it originated from.
type NormalizedTicker struct {
	Exchange   string
	Symbol     string // normalized, e.g. "BTCUSDT"
	MarketType MarketType
	Bid        float64 // highest buy price (we sell here)
	Ask        float64 // lowest sell price (we buy here)
	Last       float64
}

// Opportunity represents a detected arbitrage spread between two venues.
type Opportunity struct {
	ID           string     `json:"id"`
	Symbol       string     `json:"symbol"`
	Type         string     `json:"type"` // "SPOT_FUTURES" | "FUTURES_FUTURES"
	BuyExchange  string     `json:"buy_exchange"`
	BuyMarket    MarketType `json:"buy_market"`
	BuyAsk       float64    `json:"buy_ask"`
	SellExchange string     `json:"sell_exchange"`
	SellMarket   MarketType `json:"sell_market"`
	SellBid      float64    `json:"sell_bid"`
	SpreadPct    float64    `json:"spread_pct"`   // gross spread %
	EntrySpread  float64    `json:"entry_spread"` // spread at entry
	ExitSpread   float64    `json:"exit_spread"`  // estimated spread at exit (reversal)
}

// ScannerResponse is the JSON envelope returned to the frontend.
type ScannerResponse struct {
	Count     int           `json:"count"`
	Data      []Opportunity `json:"data"`
	Timestamp int64         `json:"timestamp"` // unix ms of last cycle
	CycleMs   int64         `json:"cycle_ms"`  // duration of last cycle in ms
}
