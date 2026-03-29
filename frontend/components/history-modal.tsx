"use client"

import { ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import type { ArbitrageOpportunity } from "@/lib/types"
import { useSpreadHistory, useFundingRates } from "@/hooks/use-arbitrage"

interface HistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity: ArbitrageOpportunity | null
}

export function HistoryModal({ open, onOpenChange, opportunity }: HistoryModalProps) {
  if (!opportunity) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Histórico e Detalhes</DialogTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{opportunity.symbol}</span>
            <span>•</span>
            <span>{opportunity.buyExchange}</span>
            <span>→</span>
            <span>{opportunity.sellExchange}</span>
            <ChevronDown className="size-4" />
          </div>
        </DialogHeader>

        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger value="entry" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Entradas (Spread)
            </TabsTrigger>
            <TabsTrigger value="exit" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Saídas (Spread)
            </TabsTrigger>
            <TabsTrigger value="funding" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Funding Rates
            </TabsTrigger>
            <TabsTrigger value="networks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Redes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry">
            <SpreadTab opportunityId={opportunity.id} type="entry" />
          </TabsContent>

          <TabsContent value="exit">
            <SpreadTab opportunityId={opportunity.id} type="exit" />
          </TabsContent>

          <TabsContent value="funding">
            <FundingTab opportunity={opportunity} />
          </TabsContent>

          <TabsContent value="networks">
            <NetworksTab opportunity={opportunity} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function SpreadTab({ opportunityId, type }: { opportunityId: string; type: "entry" | "exit" }) {
  const { data, max, min, avg } = useSpreadHistory(opportunityId, type)
  const isEntry = type === "entry"
  const chartColor = isEntry ? "#22c55e" : "#3b82f6"

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">MÁXIMO</p>
          <p className={`text-xl font-semibold ${isEntry ? "text-emerald-500" : "text-blue-500"}`}>
            {max}%
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">MÍNIMO</p>
          <p className={`text-xl font-semibold ${isEntry ? "text-emerald-500" : "text-blue-500"}`}>
            {min}%
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">MÉDIA</p>
          <p className={`text-xl font-semibold ${isEntry ? "text-emerald-500" : "text-blue-500"}`}>
            {avg}%
          </p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Spread"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#gradient-${type})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-sm text-muted-foreground">Spread Mínimo:</span>
          <div className="flex items-center">
            <Input
              type="number"
              defaultValue={0}
              className="w-16 h-8 text-center bg-secondary border-border"
            />
            <span className="ml-2 text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Últimos Registros</h3>
        <div className="bg-secondary/30 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 px-4 py-2 text-sm text-muted-foreground border-b border-border">
            <span>HORÁRIO</span>
            <span className="text-right">SPREAD</span>
          </div>
          {data.slice(-5).reverse().map((entry, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 px-4 py-3 border-b border-border last:border-b-0"
            >
              <span>
                {entry.time} <span className="text-muted-foreground">(29/03)</span>
              </span>
              <span className={`text-right font-mono ${entry.value >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                +{entry.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FundingTab({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const { data, buyCycle, sellCycle } = useFundingRates(opportunity.id)

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">CICLO {opportunity.buyExchange.toUpperCase()}</p>
          <p className="text-2xl font-semibold">{buyCycle}</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">CICLO {opportunity.sellExchange.toUpperCase()}</p>
          <p className="text-2xl font-semibold">{sellCycle}</p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2 text-sm text-muted-foreground border-b border-border">
          <span>HORÁRIO</span>
          <span className="text-center">{opportunity.buyExchange.toUpperCase()} <span className="text-xs">(COMPRA)</span></span>
          <span className="text-center">{opportunity.sellExchange.toUpperCase()} <span className="text-xs">(VENDA)</span></span>
          <span className="text-right">DIFERENÇA</span>
        </div>
        {data.map((entry, idx) => (
          <div
            key={idx}
            className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div>
              <span>{entry.time}</span>
              <span className="text-muted-foreground text-sm block">{entry.date}</span>
            </div>
            <span className="text-center">
              {entry.buyRate !== null ? `${entry.buyRate >= 0 ? "+" : ""}${(entry.buyRate * 100).toFixed(4)}%` : "-"}
            </span>
            <span className="text-center">
              {entry.sellRate !== null ? `+${(entry.sellRate * 100).toFixed(4)}%` : "-"}
            </span>
            <span className={`text-right font-mono ${entry.difference >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {(entry.difference * 100).toFixed(4)}%
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">Histórico de Taxas</p>
    </div>
  )
}

function NetworksTab({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const networks = [
    { name: "Ethereum", symbol: "ETH", fee: "~$2.50", time: "~5 min" },
    { name: "Arbitrum", symbol: "ARB", fee: "~$0.10", time: "~1 min" },
    { name: "BSC", symbol: "BNB", fee: "~$0.05", time: "~30 sec" },
    { name: "Polygon", symbol: "MATIC", fee: "~$0.01", time: "~30 sec" },
  ]

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Redes disponíveis para transferência de {opportunity.symbol}
      </p>

      <div className="space-y-2">
        {networks.map((network) => (
          <div
            key={network.symbol}
            className="bg-secondary/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-sm font-medium">{network.symbol}</span>
              </div>
              <div>
                <p className="font-medium">{network.name}</p>
                <p className="text-sm text-muted-foreground">{network.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">Taxa: {network.fee}</p>
              <p className="text-sm text-muted-foreground">Tempo: {network.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
