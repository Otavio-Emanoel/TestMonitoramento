"use client"

import { useState } from "react"
import {
  Eye,
  Bell,
  ArrowUpDown,
  Maximize2,
  BarChart3,
  MessageCircle,
  X,
  ExternalLink,
  Info,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ArbitrageOpportunity } from "@/lib/types"

interface ArbitrageTableProps {
  opportunities: ArbitrageOpportunity[]
  onViewHistory: (opportunity: ArbitrageOpportunity) => void
  isLoading: boolean
}

export function ArbitrageTable({ opportunities, onViewHistory, isLoading }: ArbitrageTableProps) {
  const [entriesPerPage, setEntriesPerPage] = useState("100")
  const [currentPage, setCurrentPage] = useState(1)

  const totalEntries = opportunities.length
  const totalPages = Math.ceil(totalEntries / parseInt(entriesPerPage))

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Oportunidade
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Compra
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Venda
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Spread
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Spread Saída
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase">
                Invertidas (4h)
              </TableHead>
              <TableHead className="text-muted-foreground font-normal text-xs uppercase w-48">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando oportunidades...
                </TableCell>
              </TableRow>
            ) : opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhuma oportunidade encontrada
                </TableCell>
              </TableRow>
            ) : (
              opportunities.map((opp) => (
                <TableRow key={opp.id} className="border-border hover:bg-secondary/30">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground">{opp.symbol}</p>
                      <p className="text-xs text-muted-foreground">{opp.type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{opp.buyExchange}</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="text-muted-foreground ml-1">{opp.buyPrice}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        VOL: {opp.buyVolume}
                        {opp.buyFundingRate !== undefined && (
                          <span className="ml-2">FR: {opp.buyFundingRate}%</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{opp.sellExchange}</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="text-muted-foreground ml-1">{opp.sellPrice}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        VOL: {opp.sellVolume}
                        {opp.sellFundingRate !== undefined && (
                          <span className="ml-2">FR: {opp.sellFundingRate}%</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold text-lg ${opp.spreadEntry >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {opp.spreadEntry >= 0 ? "+" : ""}{opp.spreadEntry.toFixed(2)}%
                      </span>
                      {opp.sellFundingRate !== undefined && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="size-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Funding Rate: {opp.sellFundingRate >= 0 ? "+" : ""}{opp.sellFundingRate}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {opp.sellFundingRate !== undefined && (
                      <p className={`text-xs ${opp.sellFundingRate >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {opp.sellFundingRate >= 0 ? "+" : ""}{opp.sellFundingRate}%
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold text-lg ${opp.spreadExit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {opp.spreadExit >= 0 ? "+" : ""}{opp.spreadExit.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {opp.inverted} invertidas
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => onViewHistory(opp)}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver histórico</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <Bell className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Criar alerta</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Inverter</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <Maximize2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Expandir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <BarChart3 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gráfico</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <MessageCircle className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Discord</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remover</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
            <SelectTrigger className="w-20 h-8 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <span className="sr-only">Anterior</span>
            &lt;
          </Button>
          <Button
            variant="default"
            size="icon"
            className="size-8"
          >
            {currentPage}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <span className="sr-only">Próximo</span>
            &gt;
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          1 - {Math.min(parseInt(entriesPerPage), totalEntries)} of {totalEntries} entries
        </div>
      </div>
    </div>
  )
}
