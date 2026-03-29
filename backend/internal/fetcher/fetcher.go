package fetcher

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"arbitrage-engine/internal/model"
)

// Fetcher is implemented by each exchange adapter.
type Fetcher interface {
	// Name returns the canonical exchange identifier.
	Name() string
	// FetchSpot returns all normalized spot tickers available.
	FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error)
	// FetchFutures returns all normalized perpetual futures tickers available.
	FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error)
}

// ---------------------------------------------------------------------------
// Shared HTTP client (one instance reused across all fetchers)
// ---------------------------------------------------------------------------

var httpClient = &http.Client{
	Timeout: 8 * time.Second,
	Transport: &http.Transport{
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     30 * time.Second,
	},
}

// getJSON performs an HTTP GET and decodes the JSON body into dst.
func getJSON(ctx context.Context, url string, dst any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "arbitrage-engine/1.0")

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http get %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("http %d from %s: %s", resp.StatusCode, url, body)
	}

	if err := json.NewDecoder(resp.Body).Decode(dst); err != nil {
		return fmt.Errorf("decode json from %s: %w", url, err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Symbol normalizer
// ---------------------------------------------------------------------------

var (
	separators    = strings.NewReplacer("-", "", "_", "", "/", "")
	futuresSuffix = regexp.MustCompile(`(?i)(UMCBL|DMCBL|CMCBL|SWAP|PERP|_PERP)$`)
	// KuCoin futures symbols end with "M" after a quote currency (USDTM, USDM)
	kucoinFutureM = regexp.MustCompile(`(USDT|USD|BTC|ETH|BNB)M$`)
)

// NormalizeSymbol converts any exchange-specific symbol to a canonical form.
// Examples:
//
//	"BTC-USDT"      → "BTCUSDT"
//	"BTC_USDT"      → "BTCUSDT"
//	"XBTUSDTM"      → "BTCUSDT"   (KuCoin futures)
//	"BTCUSDT_UMCBL" → "BTCUSDT"   (Bitget futures)
func NormalizeSymbol(raw string) string {
	s := strings.ToUpper(separators.Replace(raw))

	// Strip known futures suffixes (Bitget, BingX, Gate)
	s = futuresSuffix.ReplaceAllString(s, "")

	// KuCoin futures: "XBTUSDTM" → first strip trailing M → "XBTUSDT"
	if kucoinFutureM.MatchString(s) {
		s = s[:len(s)-1]
	}

	// XBT is Bitcoin in some exchanges (KuCoin futures)
	s = strings.ReplaceAll(s, "XBT", "BTC")

	return s
}

// All returns every enabled fetcher.
func All() []Fetcher {
	return []Fetcher{
		NewKuCoin(),
		NewBingX(),
		NewBitget(),
		NewGateIO(),
		NewMERX(),
	}
}
