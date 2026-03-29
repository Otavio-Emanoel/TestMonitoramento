package fetcher

import (
	"context"
	"strconv"

	"arbitrage-engine/internal/model"
)

// BingX docs:
//   Spot:    GET https://open-api.bingx.com/openApi/spot/v1/ticker/24hr
//   Futures: GET https://open-api.bingx.com/openApi/swap/v2/quote/ticker

const (
	bingxSpotURL    = "https://open-api.bingx.com/openApi/spot/v1/ticker/24hr"
	bingxFuturesURL = "https://open-api.bingx.com/openApi/swap/v2/quote/ticker"
)

// ── Response shapes ──────────────────────────────────────────────────────────

type bingxSpotResp struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data []struct {
		Symbol    string `json:"symbol"`
		BidPrice  string `json:"bidPrice"`
		AskPrice  string `json:"askPrice"`
		LastPrice string `json:"lastPrice"`
	} `json:"data"`
}

type bingxFuturesResp struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data []struct {
		Symbol    string `json:"symbol"`
		BidPrice  string `json:"bidPrice"`
		AskPrice  string `json:"askPrice"`
		LastPrice string `json:"lastPrice"`
	} `json:"data"`
}

// ── Fetcher implementation ───────────────────────────────────────────────────

type BingX struct{}

func NewBingX() *BingX { return &BingX{} }

func (b *BingX) Name() string { return "BingX" }

func (b *BingX) FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error) {
	var resp bingxSpotResp
	if err := getJSON(ctx, bingxSpotURL, &resp); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data))
	for _, t := range resp.Data {
		bid, errB := strconv.ParseFloat(t.BidPrice, 64)
		ask, errA := strconv.ParseFloat(t.AskPrice, 64)
		last, _ := strconv.ParseFloat(t.LastPrice, 64)
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

func (b *BingX) FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error) {
	var resp bingxFuturesResp
	if err := getJSON(ctx, bingxFuturesURL, &resp); err != nil {
		return nil, err
	}

	tickers := make([]model.NormalizedTicker, 0, len(resp.Data))
	for _, t := range resp.Data {
		bid, errB := strconv.ParseFloat(t.BidPrice, 64)
		ask, errA := strconv.ParseFloat(t.AskPrice, 64)
		last, _ := strconv.ParseFloat(t.LastPrice, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   b.Name(),
			Symbol:     NormalizeSymbol(t.Symbol),
			MarketType: model.Futures,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}
