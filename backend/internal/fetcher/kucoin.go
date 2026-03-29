package fetcher

import (
	"context"
	"strconv"

	"arbitrage-engine/internal/model"
)

// KuCoin docs:
//   Spot:    GET https://api.kucoin.com/api/v1/market/allTickers
//   Futures: GET https://api-futures.kucoin.com/api/v1/contracts/active

const (
	kuCoinSpotURL    = "https://api.kucoin.com/api/v1/market/allTickers"
	kuCoinFuturesURL = "https://api-futures.kucoin.com/api/v1/contracts/active"
)

// ── Response shapes ──────────────────────────────────────────────────────────

type kuCoinSpotResp struct {
	Code string `json:"code"`
	Data struct {
		Ticker []struct {
			Symbol string `json:"symbol"`
			Buy    string `json:"buy"`  // bid
			Sell   string `json:"sell"` // ask
			Last   string `json:"last"`
		} `json:"ticker"`
	} `json:"data"`
}

type kuCoinFuturesResp struct {
	Code string `json:"code"`
	Data []struct {
		Symbol          string  `json:"symbol"`
		MarkPrice       float64 `json:"markPrice"`
		IndexPrice      float64 `json:"indexPrice"`
		LastTradePrice  float64 `json:"lastTradePrice"`
	} `json:"data"`
}

// ── Fetcher implementation ───────────────────────────────────────────────────

type KuCoin struct{}

func NewKuCoin() *KuCoin { return &KuCoin{} }

func (k *KuCoin) Name() string { return "KuCoin" }

func (k *KuCoin) FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error) {
	var resp kuCoinSpotResp
	if err := getJSON(ctx, kuCoinSpotURL, &resp); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data.Ticker))
	for _, t := range resp.Data.Ticker {
		bid, errB := strconv.ParseFloat(t.Buy, 64)
		ask, errA := strconv.ParseFloat(t.Sell, 64)
		last, _ := strconv.ParseFloat(t.Last, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   k.Name(),
			Symbol:     NormalizeSymbol(t.Symbol),
			MarketType: model.Spot,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}

func (k *KuCoin) FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error) {
	// KuCoin Futures /contracts/active returns contract metadata including
	// markPrice. Bid/ask are not bulk-available; we use markPrice ± tiny
	// synthetic spread as an approximation for the cross-engine.
	// Note: for production use, subscribe to the WS feed or call
	// /api/v1/ticker per contract.
	var resp kuCoinFuturesResp
	if err := getJSON(ctx, kuCoinFuturesURL, &resp); err != nil {
		return nil, err
	}

	const halfSpreadPct = 0.0001 // 0.01% synthetic half-spread

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data))
	for _, t := range resp.Data {
		price := t.MarkPrice
		if price <= 0 {
			price = t.LastTradePrice
		}
		if price <= 0 {
			continue
		}
		half := price * halfSpreadPct
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   k.Name(),
			Symbol:     NormalizeSymbol(t.Symbol),
			MarketType: model.Futures,
			Bid:        price - half,
			Ask:        price + half,
			Last:       price,
		})
	}
	return tickers, nil
}
