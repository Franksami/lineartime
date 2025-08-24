"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Cpu, HardDrive, Zap, X } from "lucide-react"

interface PerformanceMetrics {
  fps: number
  renderTime: number
  memoryUsage: number
  eventCount: number
  lastUpdate: number
}

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics
  poolStats?: {
    total: number
    inUse: number
    available: number
  }
  onClose: () => void
  visible: boolean
}

export function PerformanceOverlay({ metrics, poolStats, onClose, visible }: PerformanceOverlayProps) {
  if (!visible) return null

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return "text-green-600"
    if (fps >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const getMemoryColor = (memory: number) => {
    if (memory < 50) return "text-green-600"
    if (memory < 100) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="bg-card/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">FPS</span>
            </div>
            <Badge variant="outline" className={getFPSColor(metrics.fps)}>
              {metrics.fps}
            </Badge>
          </div>

          {/* Render Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Render Time</span>
            </div>
            <Badge variant="outline">{metrics.renderTime.toFixed(2)}ms</Badge>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Memory</span>
            </div>
            <Badge variant="outline" className={getMemoryColor(metrics.memoryUsage)}>
              {metrics.memoryUsage}MB
            </Badge>
          </div>

          {/* Event Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Events</span>
            </div>
            <Badge variant="outline">{metrics.eventCount}</Badge>
          </div>

          {/* Object Pool Stats */}
          {poolStats && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Object Pool</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{poolStats.total}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{poolStats.inUse}</div>
                  <div className="text-muted-foreground">In Use</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{poolStats.available}</div>
                  <div className="text-muted-foreground">Available</div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Tips</div>
            <div className="space-y-1 text-xs">
              {metrics.fps < 30 && <div className="text-red-600">• Low FPS detected - consider reducing events</div>}
              {metrics.memoryUsage > 100 && (
                <div className="text-yellow-600">• High memory usage - consider cleanup</div>
              )}
              {metrics.renderTime > 16 && (
                <div className="text-yellow-600">• Slow rendering - enable virtualization</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
