package fetcher

import (
	"context"
	"strconv"

	"arbitrage-engine/internal/model"
)

// Bitget docs:
//   Spot:    GET https://api.bitget.com/api/v2/spot/market/tickers
//   Futures: GET https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES

const (
	bitgetSpotURL    = "https://api.bitget.com/api/v2/spot/market/tickers"
	bitgetFuturesURL = "https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES"
)

// ── Response shapes ──────────────────────────────────────────────────────────

type bitgetSpotResp struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
	Data []struct {
		Symbol string `json:"symbol"` // e.g. "BTCUSDT"
		BidPr  string `json:"bidPr"`
		AskPr  string `json:"askPr"`
		LastPr string `json:"lastPr"`
	} `json:"data"`
}

type bitgetFuturesResp struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
	Data []struct {
		Symbol string `json:"symbol"` // e.g. "BTCUSDT_UMCBL"
		BidPr  string `json:"bidPr"`
		AskPr  string `json:"askPr"`
		LastPr string `json:"lastPr"`
	} `json:"data"`
}

// ── Fetcher implementation ───────────────────────────────────────────────────

type Bitget struct{}

func NewBitget() *Bitget { return &Bitget{} }

func (b *Bitget) Name() string { return "Bitget" }

func (b *Bitget) FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error) {
	var resp bitgetSpotResp
	if err := getJSON(ctx, bitgetSpotURL, &resp); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data))
	for _, t := range resp.Data {
		bid, errB := strconv.ParseFloat(t.BidPr, 64)
		ask, errA := strconv.ParseFloat(t.AskPr, 64)
		last, _ := strconv.ParseFloat(t.LastPr, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   b.Name(),
			Symbol:     NormalizeSymbol(t.Symbol),
			MarketType: model.Spot,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}

func (b *Bitget) FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error) {
	var resp bitgetFuturesResp
	if err := getJSON(ctx, bitgetFuturesURL, &resp); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data))
	for _, t := range resp.Data {
		bid, errB := strconv.ParseFloat(t.BidPr, 64)
		ask, errA := strconv.ParseFloat(t.AskPr, 64)
		last, _ := strconv.ParseFloat(t.LastPr, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   b.Name(),
			Symbol:     NormalizeSymbol(t.Symbol), // strips "_UMCBL"
			MarketType: model.Futures,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}
