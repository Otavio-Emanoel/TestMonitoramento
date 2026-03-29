package engine

import (
	"context"
	"fmt"
	"log"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"arbitrage-engine/internal/fetcher"
	"arbitrage-engine/internal/model"
)

const (
	cycleDuration    = 10 * time.Second
	minSpreadPct     = 0.10  // discard opportunities below 0.10%
	fetchTimeout     = 8 * time.Second
	// Estimated taker fees per leg (adjust per exchange/tier).
	estimatedFeePct  = 0.10 // 0.10% per leg × 2 legs = 0.20% round-trip
)

// Engine orchestrates the 10-second tick cycle and exposes the latest snapshot.
type Engine struct {
	fetchers []fetcher.Fetcher

	mu       sync.RWMutex
	snapshot model.ScannerResponse

	cycleCount atomic.Int64
}

// New creates an Engine with all configured fetchers.
func New() *Engine {
	return &Engine{
		fetchers: fetcher.All(),
		snapshot: model.ScannerResponse{
			Data: []model.Opportunity{},
		},
	}
}

// Start launches the background cycle loop. It runs the first cycle
// immediately and then every 10 seconds thereafter.
func (e *Engine) Start() {
	go func() {
		e.runCycle()
		ticker := time.NewTicker(cycleDuration)
		defer ticker.Stop()
		for range ticker.C {
			e.runCycle()
		}
	}()
}

// Snapshot returns the latest computed opportunities (thread-safe).
func (e *Engine) Snapshot() model.ScannerResponse {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.snapshot
}

// ── Cycle ────────────────────────────────────────────────────────────────────

func (e *Engine) runCycle() {
	start := time.Now()
	cycleNum := e.cycleCount.Add(1)
	log.Printf("[cycle %d] starting ingestion from %d fetchers", cycleNum, len(e.fetchers))

	tickers := e.ingestConcurrent()

	opps := e.crossEngine(tickers)

	// Sort by spread descending so the fattest opportunities appear first.
	sort.Slice(opps, func(i, j int) bool {
		return opps[i].SpreadPct > opps[j].SpreadPct
	})

	elapsed := time.Since(start)

	e.mu.Lock()
	e.snapshot = model.ScannerResponse{
		Count:     len(opps),
		Data:      opps,
		Timestamp: start.UnixMilli(),
		CycleMs:   elapsed.Milliseconds(),
	}
	e.mu.Unlock()

	log.Printf("[cycle %d] done in %s — %d tickers ingested, %d opportunities found",
		cycleNum, elapsed.Round(time.Millisecond), len(tickers), len(opps))
}

// ── Concurrent ingestion ─────────────────────────────────────────────────────

type fetchResult struct {
	tickers []model.NormalizedTicker
	err     error
	source  string
}

func (e *Engine) ingestConcurrent() []model.NormalizedTicker {
	ctx, cancel := context.WithTimeout(context.Background(), fetchTimeout)
	defer cancel()

	ch := make(chan fetchResult, len(e.fetchers)*2)
	var wg sync.WaitGroup

	for _, f := range e.fetchers {
		wg.Add(2) // one for spot, one for futures

		go func(f fetcher.Fetcher) {
			defer wg.Done()
			t, err := f.FetchSpot(ctx)
			ch <- fetchResult{tickers: t, err: err, source: f.Name() + "/spot"}
		}(f)

		go func(f fetcher.Fetcher) {
			defer wg.Done()
			t, err := f.FetchFutures(ctx)
			ch <- fetchResult{tickers: t, err: err, source: f.Name() + "/futures"}
		}(f)
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	var all []model.NormalizedTicker
	for res := range ch {
		if res.err != nil {
			log.Printf("[ingest] %s error: %v", res.source, res.err)
			continue
		}
		all = append(all, res.tickers...)
	}
	return all
}

// ── Cross-Engine ─────────────────────────────────────────────────────────────

// crossEngine groups tickers by symbol and evaluates every valid pair of venues.
func (e *Engine) crossEngine(tickers []model.NormalizedTicker) []model.Opportunity {
	// Index: symbol → list of tickers
	bySymbol := make(map[string][]model.NormalizedTicker, 512)
	for _, t := range tickers {
		bySymbol[t.Symbol] = append(bySymbol[t.Symbol], t)
	}

	seen := make(map[string]struct{})
	var opps []model.Opportunity

	for symbol, group := range bySymbol {
		if len(group) < 2 {
			continue
		}

		for i := 0; i < len(group); i++ {
			for j := 0; j < len(group); j++ {
				if i == j {
					continue
				}
				buy := group[i]  // we BUY at Ask
				sell := group[j] // we SELL at Bid

				if buy.Ask <= 0 || sell.Bid <= 0 {
					continue
				}

				oppType, valid := classifyPair(buy, sell)
				if !valid {
					continue
				}

				// De-duplicate: treat (buy.Exchange, buy.Market, sell.Exchange, sell.Market, symbol) as key.
				dedupKey := fmt.Sprintf("%s|%s|%s|%s|%s",
					symbol, buy.Exchange, buy.MarketType, sell.Exchange, sell.MarketType)
				if _, exists := seen[dedupKey]; exists {
					continue
				}
				seen[dedupKey] = struct{}{}

				grossSpread := (sell.Bid - buy.Ask) / buy.Ask * 100
				if grossSpread < minSpreadPct {
					continue
				}

				// Entry spread = gross spread
				// Exit spread = estimated round-trip fee cost
				entrySpread := grossSpread
				exitSpread := estimatedFeePct * 2

				opps = append(opps, model.Opportunity{
					ID:           dedupKey,
					Symbol:       symbol,
					Type:         oppType,
					BuyExchange:  buy.Exchange,
					BuyMarket:    buy.MarketType,
					BuyAsk:       buy.Ask,
					SellExchange: sell.Exchange,
					SellMarket:   sell.MarketType,
					SellBid:      sell.Bid,
					SpreadPct:    grossSpread,
					EntrySpread:  entrySpread,
					ExitSpread:   exitSpread,
				})
			}
		}
	}

	return opps
}

// classifyPair returns the opportunity type and whether the pair is a valid
// arbitrage direction according to the engine rules:
//   - Scenario A: buy Spot, sell Futures (same or different exchange)
//   - Scenario B: buy Futures (exchange X), sell Futures (exchange Y)
func classifyPair(buy, sell model.NormalizedTicker) (string, bool) {
	switch {
	case buy.MarketType == model.Spot && sell.MarketType == model.Futures:
		return "SPOT_FUTURES", true

	case buy.MarketType == model.Futures && sell.MarketType == model.Futures &&
		buy.Exchange != sell.Exchange:
		return "FUTURES_FUTURES", true

	default:
		return "", false
	}
}
