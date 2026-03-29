package fetcher

import (
	"context"
	"net/url"
	"strconv"
	"strings"

	"arbitrage-engine/internal/model"
)

// MERX / Mercado Bitcoin
// The v4 API requires an explicit list of symbols.
// Flow:
//   1) GET https://api.mercadobitcoin.net/api/v4/symbols
//   2) GET https://api.mercadobitcoin.net/api/v4/tickers?symbols=BTC-BRL,ETH-BRL,...
//
// Note: Mercado Bitcoin primarily trades against BRL. Pairs that settle in
// USDT are limited. Adjust the URL or symbol filter as needed.
// Futures/perpetuals are not currently offered; FetchFutures returns empty.

const (
	merxSymbolsURL       = "https://api.mercadobitcoin.net/api/v4/symbols"
	merxTickersBaseURL   = "https://api.mercadobitcoin.net/api/v4/tickers"
	merxSymbolsBatchSize = 80
)

// ── Response shapes ──────────────────────────────────────────────────────────

type merxTickerItem struct {
	Pair string `json:"pair"` // e.g. "BTC-BRL"
	Sell string `json:"sell"`
	Buy  string `json:"buy"`
	Ask  string `json:"ask"`
	Bid  string `json:"bid"`
	Last string `json:"last"`
}

type merxSymbolsResp struct {
	Symbols []string `json:"symbol"`
}

// ── Fetcher implementation ───────────────────────────────────────────────────

type MERX struct{}

func NewMERX() *MERX { return &MERX{} }

func (m *MERX) Name() string { return "MERX" }

func (m *MERX) FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error) {
	var symbolsResp merxSymbolsResp
	if err := getJSON(ctx, merxSymbolsURL, &symbolsResp); err != nil {
		return nil, err
	}

	symbols := symbolsResp.Symbols
	if len(symbols) == 0 {
		return nil, nil
	}

	items := make([]merxTickerItem, 0, len(symbols))
	for i := 0; i < len(symbols); i += merxSymbolsBatchSize {
		end := i + merxSymbolsBatchSize
		if end > len(symbols) {
			end = len(symbols)
		}

		q := url.Values{}
		q.Set("symbols", strings.Join(symbols[i:end], ","))
		tickersURL := merxTickersBaseURL + "?" + q.Encode()

		var batch []merxTickerItem
		if err := getJSON(ctx, tickersURL, &batch); err != nil {
			return nil, err
		}
		items = append(items, batch...)
	}

	tickers := make([]model.NormalizedTicker, 0, len(items))
	for _, t := range items {
		bidValue := firstNonEmpty(t.Bid, t.Buy)
		askValue := firstNonEmpty(t.Ask, t.Sell)

		bid, errB := strconv.ParseFloat(bidValue, 64)
		ask, errA := strconv.ParseFloat(askValue, 64)
		last, _ := strconv.ParseFloat(t.Last, 64)
		if errB != nil || errA != nil || bid <= 0 || ask <= 0 {
			continue
		}
		tickers = append(tickers, model.NormalizedTicker{
			Exchange:   m.Name(),
			Symbol:     NormalizeSymbol(t.Pair),
			MarketType: model.Spot,
			Bid:        bid,
			Ask:        ask,
			Last:       last,
		})
	}
	return tickers, nil
}

// FetchFutures returns an empty list because MERX does not offer perpetual
// futures at this time.
func (m *MERX) FetchFutures(_ context.Context) ([]model.NormalizedTicker, error) {
	return nil, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
