"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FilterState, Exchange, FilterProfile } from "@/lib/types"

const ALL_EXCHANGES: Exchange[] = ["Kucoin", "BingX", "Bitget", "Gate.io", "MEXC"]

const COINS = ["BTC", "ETH", "XRP", "SOL", "DOGE", "TRUTH", "CFG", "CRTR", "ADA", "MATIC"]

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export function FilterModal({ open, onOpenChange, filters, onFiltersChange }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const toggleProfile = (profileId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => ({
        ...p,
        isActive: p.id === profileId,
      })),
      activeProfileId: profileId,
    }))
  }

  const addProfile = () => {
    const newProfile: FilterProfile = {
      id: Date.now().toString(),
      name: `Perfil ${localFilters.profiles.length + 1}`,
      isActive: false,
    }
    setLocalFilters((prev) => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
    }))
  }

  const deleteProfile = (profileId: string) => {
    if (localFilters.profiles.length <= 1) return
    setLocalFilters((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== profileId),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurar Filtros</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure os filtros para encontrar oportunidades de arbitragem
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Perfis de Filtro */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">Perfis de Filtro</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os ajustes ficam dentro de um perfil. Escolha um para editar; salvamos automaticamente.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addProfile} className="gap-1">
                <Plus className="size-4" />
                Criar Perfil
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {localFilters.profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => toggleProfile(profile.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    profile.isActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{profile.name}</span>
                    <div className="flex items-center gap-2">
                      {profile.isActive && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Check className="size-3" />
                          Ativo
                        </span>
                      )}
                      {localFilters.profiles.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProfile(profile.id)
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique para ativar e editar os filtros deste perfil.
                  </p>
                </div>
              ))}
              
              <div className="p-3 rounded-lg border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  Use &ldquo;Criar Perfil&rdquo; para separar estratégias diferentes.
                </p>
              </div>
            </div>
          </div>

          {/* Filtros de Moedas e Lista Negra */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Filtro de Moedas</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione pares específicos que deseja visualizar.
              </p>
              <div>
                <label className="text-sm text-muted-foreground">Moedas</label>
                <Select>
                  <SelectTrigger className="mt-1 bg-input border-border">
                    <SelectValue placeholder="Escolha as moedas para exibir" />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((coin) => (
                      <SelectItem key={coin} value={coin}>
                        {coin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Lista negra</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione pares que deseja ocultar.
              </p>
              <div>
                <label className="text-sm text-muted-foreground">Moedas</label>
                <Select>
                  <SelectTrigger className="mt-1 bg-input border-border">
                    <SelectValue placeholder="Escolha as moedas para ocultar" />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((coin) => (
                      <SelectItem key={coin} value={coin}>
                        {coin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Corretoras e Tipos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Corretoras</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Escolha onde comprar ou vender ou deixe vazio para todas.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-muted-foreground">Compra</label>
                    <span className="text-sm text-muted-foreground">
                      {localFilters.buyExchanges.length} selecionados
                    </span>
                  </div>
                  <Select>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={`${localFilters.buyExchanges.length} selecionados`} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_EXCHANGES.map((exchange) => (
                        <SelectItem key={exchange} value={exchange}>
                          {exchange}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-muted-foreground">Venda</label>
                    <span className="text-sm text-muted-foreground">
                      {localFilters.sellExchanges.length} selecionados
                    </span>
                  </div>
                  <Select>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={`${localFilters.sellExchanges.length} selecionados`} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_EXCHANGES.map((exchange) => (
                        <SelectItem key={exchange} value={exchange}>
                          {exchange}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-medium mb-1">Tipos de oportunidade</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Use os switches para focar no estilo de operação.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Spot x Futuro</p>
                    <p className="text-sm text-muted-foreground">
                      Compra em spot e venda no mercado futuro
                    </p>
                  </div>
                  <Switch
                    checked={localFilters.spotFuturo}
                    onCheckedChange={(checked) =>
                      setLocalFilters((prev) => ({ ...prev, spotFuturo: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Futuro x Futuro</p>
                    <p className="text-sm text-muted-foreground">
                      Estratégias entre contratos futuros
                    </p>
                  </div>
                  <Switch
                    checked={localFilters.futuroFuturo}
                    onCheckedChange={(checked) =>
                      setLocalFilters((prev) => ({ ...prev, futuroFuturo: checked }))
                    }
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Deixe desmarcado para visualizar todos os tipos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
