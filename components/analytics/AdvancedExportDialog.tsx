'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useDragDropAnalytics } from '@/lib/analytics/dragDropAnalytics';
import {
  exportAnalyticsToCSV,
  exportComprehensiveAnalytics,
  exportDragDropEventsToCSV,
  exportDragDropMetricsToCSV,
  exportDragDropToJSON,
  generateAnalyticsReport,
  generateDragDropReport,
} from '@/lib/utils/exportUtils';
import type { Event } from '@/types/calendar';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Combine,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Mouse,
  Settings,
} from 'lucide-react';
import React, { useState } from 'react';

interface AdvancedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarAnalytics: any;
  events: Event[];
  year: number;
}

type ExportFormat = 'csv' | 'json' | 'txt';
type ExportScope = 'calendar' | 'dragdrop' | 'comprehensive';

export function AdvancedExportDialog({
  open,
  onOpenChange,
  calendarAnalytics,
  events,
  year,
}: AdvancedExportDialogProps) {
  const analytics = useDragDropAnalytics();

  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportScope, setExportScope] = useState<ExportScope>('comprehensive');
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const formatOptions = [
    {
      value: 'csv' as ExportFormat,
      label: 'CSV (Spreadsheet)',
      icon: FileSpreadsheet,
      description: 'Excel/Google Sheets compatible',
      fileExtension: '.csv',
    },
    {
      value: 'json' as ExportFormat,
      label: 'JSON (Data)',
      icon: FileJson,
      description: 'Machine-readable format',
      fileExtension: '.json',
    },
    {
      value: 'txt' as ExportFormat,
      label: 'Text Report',
      icon: FileText,
      description: 'Human-readable summary',
      fileExtension: '.txt',
    },
  ];

  const scopeOptions = [
    {
      value: 'calendar' as ExportScope,
      label: 'Calendar Analytics Only',
      icon: Calendar,
      description: 'Events, categories, and time analysis',
    },
    {
      value: 'dragdrop' as ExportScope,
      label: 'Drag & Drop Analytics Only',
      icon: Mouse,
      description: 'Interaction patterns and performance',
    },
    {
      value: 'comprehensive' as ExportScope,
      label: 'Complete Analytics Package',
      icon: Combine,
      description: 'All data combined in one export',
    },
  ];

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('idle');

    try {
      const dragDropMetrics = await analytics.generateMetrics();
      const dragDropEvents = await analytics.getRecentActivity(365 * 24); // Get full year

      switch (exportScope) {
        case 'calendar':
          if (exportFormat === 'csv') {
            exportAnalyticsToCSV(calendarAnalytics, year);
          } else if (exportFormat === 'txt') {
            const report = generateAnalyticsReport(calendarAnalytics, year);
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `calendar-analytics-${year}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } else {
            // JSON export for calendar data
            const jsonData = {
              exportedAt: new Date().toISOString(),
              year,
              version: '1.0',
              analytics: calendarAnalytics,
              ...(includeEvents && { events }),
            };
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `calendar-analytics-${year}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          break;

        case 'dragdrop':
          if (exportFormat === 'csv') {
            if (includeEvents) {
              exportDragDropEventsToCSV(dragDropEvents, `dragdrop-events-${year}.csv`);
            }
            if (includeMetrics) {
              exportDragDropMetricsToCSV(dragDropMetrics, `dragdrop-metrics-${year}.csv`);
            }
          } else if (exportFormat === 'json') {
            exportDragDropToJSON(
              dragDropMetrics,
              dragDropEvents,
              `dragdrop-analytics-${year}.json`
            );
          } else {
            const report = generateDragDropReport(dragDropMetrics, dragDropEvents);
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dragdrop-report-${year}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          break;

        case 'comprehensive':
          exportComprehensiveAnalytics(
            calendarAnalytics,
            dragDropMetrics,
            events,
            dragDropEvents,
            year,
            exportFormat
          );
          break;
      }

      setExportStatus('success');

      // Auto-close dialog after successful export
      setTimeout(() => {
        onOpenChange(false);
        setExportStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportDescription = () => {
    const selectedFormat = formatOptions.find((f) => f.value === exportFormat);
    const selectedScope = scopeOptions.find((s) => s.value === exportScope);

    return `Export ${selectedScope?.label.toLowerCase()} as ${selectedFormat?.label} format`;
  };

  const getEstimatedFileSize = () => {
    // Rough estimate based on scope and format
    let baseSize = 0;

    switch (exportScope) {
      case 'calendar':
        baseSize = 50; // KB
        break;
      case 'dragdrop':
        baseSize = 30; // KB
        break;
      case 'comprehensive':
        baseSize = 100; // KB
        break;
    }

    // Format multipliers
    const multiplier = exportFormat === 'json' ? 1.5 : exportFormat === 'txt' ? 0.8 : 1.2;
    const estimatedSize = Math.round(baseSize * multiplier);

    return estimatedSize < 1000 ? `~${estimatedSize}KB` : `~${(estimatedSize / 1000).toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Advanced Analytics Export
          </DialogTitle>
          <DialogDescription>
            Export your calendar and drag & drop analytics in multiple formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              What to Export
            </h3>
            <RadioGroup
              value={exportScope}
              onValueChange={(value) => setExportScope(value as ExportScope)}
            >
              <div className="space-y-3">
                {scopeOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <Label
                        htmlFor={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Export Format</h3>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <div className="grid grid-cols-1 gap-3">
                {formatOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={`format-${option.value}`} />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <Label
                        htmlFor={`format-${option.value}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {option.fileExtension}
                    </Badge>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Include Additional Data</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-events"
                  checked={includeEvents}
                  onCheckedChange={(checked) => setIncludeEvents(checked as boolean)}
                />
                <Label htmlFor="include-events" className="text-sm cursor-pointer">
                  Include individual events data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metrics"
                  checked={includeMetrics}
                  onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                />
                <Label htmlFor="include-metrics" className="text-sm cursor-pointer">
                  Include performance metrics
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-recommendations"
                  checked={includeRecommendations}
                  onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
                />
                <Label htmlFor="include-recommendations" className="text-sm cursor-pointer">
                  Include AI recommendations
                </Label>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Export type:</span>
                <span className="text-sm font-medium">{getExportDescription()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated size:</span>
                <span className="text-sm font-medium">{getEstimatedFileSize()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Year:</span>
                <span className="text-sm font-medium">{year}</span>
              </div>
              {exportStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 /* TODO: Use semantic token */ text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Export successful!
                </div>
              )}
              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 /* TODO: Use semantic token */ text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Export failed. Please try again.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Exports will download to your default Downloads folder
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
