package fetcher

import (
	"context"
	"strconv"

	"arbitrage-engine/internal/model"
)

// Gate.io docs:
//   Spot:    GET https://api.gateio.ws/api/v4/spot/tickers
//   Futures: GET https://api.gateio.ws/api/v4/futures/usdt/tickers

const (
	gateioSpotURL    = "https://api.gateio.ws/api/v4/spot/tickers"
	gateioFuturesURL = "https://api.gateio.ws/api/v4/futures/usdt/tickers"
)

// ── Response shapes ──────────────────────────────────────────────────────────

// Gate.io returns a top-level JSON array for both spot and futures.

type gateioSpotTicker struct {
	CurrencyPair string `json:"currency_pair"` // e.g. "BTC_USDT"
	Last         string `json:"last"`
	LowestAsk    string `json:"lowest_ask"`
	HighestBid   string `json:"highest_bid"`
}

type gateioFuturesTicker struct {
	Contract   string `json:"contract"`    // e.g. "BTC_USDT"
	Last       string `json:"last"`
	LowestAsk  string `json:"lowest_ask"`
	HighestBid string `json:"highest_bid"`
	MarkPrice  string `json:"mark_price"`
	IndexPrice string `json:"index_price"`
}

// ── Fetcher implementation ───────────────────────────────────────────────────

type GateIO struct{}

func NewGateIO() *GateIO { return &GateIO{} }

func (g *GateIO) Name() string { return "Gate.io" }

func (g *GateIO) FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error) {
	var raw []gateioSpotTicker
	if err := getJSON(ctx, gateioSpotURL, &raw); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(raw))
	for _, t := range raw {
		bid, errB := strconv.ParseFloat(t.HighestBid, 64)
		ask, errA := strconv.ParseFloat(t.LowestAsk, 64)
		last, _ := strconv.ParseFloat(t.Last, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   g.Name(),
			Symbol:     NormalizeSymbol(t.CurrencyPair),
			MarketType: model.Spot,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}

func (g *GateIO) FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error) {
	var raw []gateioFuturesTicker
	if err := getJSON(ctx, gateioFuturesURL, &raw); err != nil {
		return nil, err
	}

	const halfSpreadPct = 0.0001

	tickers := make([]model.NormalizedTicker, 0, len(raw))
	for _, t := range raw {
		bid, errB := strconv.ParseFloat(t.HighestBid, 64)
		ask, errA := strconv.ParseFloat(t.LowestAsk, 64)
		last, _ := strconv.ParseFloat(t.Last, 64)

		// Gate.io futures sometimes omit bid/ask; fall back to mark price.
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			mark, errM := strconv.ParseFloat(t.MarkPrice, 64)
			if errM != nil || mark <= 0 {
				continue
			}
			half := mark * halfSpreadPct
			bid = mark - half
			ask = mark + half
			last = mark
		}

		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   g.Name(),
			Symbol:     NormalizeSymbol(t.Contract),
			MarketType: model.Futures,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}
