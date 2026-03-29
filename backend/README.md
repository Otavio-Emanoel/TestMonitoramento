# Arbitrage Engine

Motor de arbitragem REST stateless, executado inteiramente em memória com ciclos de 10 segundos.

## Arquitetura

```
main.go
└── engine.Start()          ← goroutine de ciclo (10 s)
    ├── ingestConcurrent()  ← 10 goroutines (5 exchanges × spot + futures)
    │   ├── KuCoin   spot / futures
    │   ├── BingX    spot / futures
    │   ├── Bitget   spot / futures
    │   ├── Gate.io  spot / futures
    │   └── MERX     spot / futures (futuros não disponíveis)
    ├── crossEngine()       ← cruzamento Spot→Futuro e Futuro→Futuro
    └── snapshot (sync.RWMutex)
└── server.Handler()        ← HTTP com CORS + logging middleware
    ├── GET /api/v1/scanner/opportunities
    └── GET /api/v1/health
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/api/v1/scanner/opportunities` | Retorna o último snapshot calculado |
| `GET`  | `/api/v1/health` | Liveness probe |

### Exemplo de resposta — `/api/v1/scanner/opportunities`

```json
{
  "count": 3,
  "data": [
    {
      "id": "BTCUSDT|BingX|spot|KuCoin|futures",
      "symbol": "BTCUSDT",
      "type": "SPOT_FUTURES",
      "buy_exchange": "BingX",
      "buy_market": "spot",
      "buy_ask": 68420.10,
      "sell_exchange": "KuCoin",
      "sell_market": "futures",
      "sell_bid": 68557.80,
      "spread_pct": 0.2014,
      "entry_spread": 0.2014,
      "exit_spread": 0.20
    }
  ],
  "timestamp": 1718200000000,
  "cycle_ms": 823
}
```

## Configuração

| Variável de ambiente | Padrão | Descrição |
|----------------------|--------|-----------|
| `LISTEN_ADDR` | `:8080` | Endereço e porta do servidor HTTP |

## Como rodar

### Localmente

```bash
# Requer Go 1.22+
go run .

# ou build primeiro
go build -o arbitrage-engine .
./arbitrage-engine
```

### Docker

```bash
docker build -t arbitrage-engine .
docker run -p 8080:8080 arbitrage-engine
```

### Docker Compose

```yaml
services:
  arbitrage-engine:
    build: .
    ports:
      - "8080:8080"
    environment:
      LISTEN_ADDR: ":8080"
    restart: unless-stopped
```

## Parâmetros ajustáveis

Em `internal/engine/engine.go`:

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `cycleDuration` | `10s` | Intervalo entre ciclos |
| `minSpreadPct` | `0.10` | Threshold mínimo de spread (%) |
| `fetchTimeout` | `8s` | Timeout por ciclo de ingestão |
| `estimatedFeePct` | `0.10` | Fee estimada por leg (%) |

## Adicionando uma nova exchange

1. Crie `internal/fetcher/minhaexchange.go` implementando a interface `Fetcher`:
   ```go
   type Fetcher interface {
       Name() string
       FetchSpot(ctx context.Context) ([]model.NormalizedTicker, error)
       FetchFutures(ctx context.Context) ([]model.NormalizedTicker, error)
   }
   ```
2. Registre no slice retornado por `fetcher.All()` em `internal/fetcher/fetcher.go`.

## Normalização de símbolos

A função `NormalizeSymbol` padroniza todos os formatos de símbolo:

| Entrada | Saída |
|---------|-------|
| `BTC-USDT` | `BTCUSDT` |
| `BTC_USDT` | `BTCUSDT` |
| `BTCUSDT_UMCBL` | `BTCUSDT` |
| `XBTUSDTM` | `BTCUSDT` |
| `BTC/USDT` | `BTCUSDT` |

## Cenários de arbitragem

- **SPOT_FUTURES** — Compra no mercado spot (ask mais barato) e vende no perpétuo (bid mais alto) da mesma moeda, em qualquer exchange.
- **FUTURES_FUTURES** — Compra o perpétuo na exchange X (ask) e vende na exchange Y (bid), desde que sejam exchanges diferentes.
