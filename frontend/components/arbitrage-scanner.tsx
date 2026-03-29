"use client"

import { useState } from "react"
import {
  Search,
  Pause,
  Play,
  SlidersHorizontal,
  Trash2,
  BellOff,
  Bell,
  Menu,
  Send,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArbitrageTable } from "./arbitrage-table"
import { FilterModal } from "./filter-modal"
import { HistoryModal } from "./history-modal"
import { useArbitrage } from "@/hooks/use-arbitrage"
import type { FilterState, ArbitrageOpportunity, Exchange } from "@/lib/types"

const ALL_EXCHANGES: Exchange[] = ["Kucoin", "BingX", "Bitget", "Gate.io", "MEXC"]

const defaultFilters: FilterState = {
  profiles: [{ id: "1", name: "Padrão", isActive: true }],
  activeProfileId: "1",
  coins: [],
  blacklist: [],
  buyExchanges: ALL_EXCHANGES,
  sellExchanges: ALL_EXCHANGES,
  spotFuturo: false,
  futuroFuturo: false,
}

export function ArbitrageScanner() {
  const [isPaused, setIsPaused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null)
  const [excludedCount] = useState(17)
  const [silencedCount] = useState(47)

  const { opportunities, isLoading, lastUpdate } = useArbitrage(filters, isPaused)

  // Filtra por busca
  const filteredOpportunities = opportunities.filter((opp) =>
    opp.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewHistory = (opportunity: ArbitrageOpportunity) => {
    setSelectedOpportunity(opportunity)
    setHistoryModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="p-2 hover:bg-secondary rounded-lg">
            <Menu className="size-5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-secondary rounded-lg">
              <Bell className="size-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg">
              <svg className="size-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-secondary rounded-lg">
              <Send className="size-5 text-muted-foreground" />
            </button>
            <button className="relative p-2 hover:bg-secondary rounded-lg">
              <User className="size-5 text-muted-foreground" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Scanner de Arbitragem</h1>
          <p className="text-muted-foreground">
            Encontre oportunidades de arbitragem entre corretoras
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`${
                isPaused
                  ? "border-amber-500/50 text-amber-500 bg-amber-500/10"
                  : "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
              }`}
            >
              <span className={`size-2 rounded-full mr-1.5 ${isPaused ? "bg-amber-500" : "bg-emerald-500"}`} />
              {isPaused ? "Pausado" : "Conectado"}
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Atualizado {lastUpdate}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sinais"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 border-border"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="size-4" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="size-4" />
                  Pausar
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-border"
              onClick={() => setFilterModalOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filtros
            </Button>

            <Button variant="outline" className="gap-2 border-border relative">
              <Trash2 className="size-4" />
              Excluídos
              {excludedCount > 0 && (
                <Badge className="absolute -top-2 -right-2 size-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                  {excludedCount}
                </Badge>
              )}
            </Button>

            <Button variant="outline" className="gap-2 border-border relative">
              <BellOff className="size-4" />
              Silenciados
              {silencedCount > 0 && (
                <Badge className="absolute -top-2 -right-2 size-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                  {silencedCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Table */}
        <ArbitrageTable
          opportunities={filteredOpportunities}
          onViewHistory={handleViewHistory}
          isLoading={isLoading}
        />
      </main>

      {/* Modals */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <HistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        opportunity={selectedOpportunity}
      />
    </div>
  )
}
