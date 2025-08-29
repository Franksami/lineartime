'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ThemeConfig, useThemeManager } from '@/lib/theme-manager';
import { Check, Palette, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomThemeCreator } from './custom-theme-creator';

interface ThemeSelectorProps {
  onClose: () => void;
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { currentTheme, presetThemes, customThemes, switchTheme, deleteCustomTheme } =
    useThemeManager();
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  const _allThemes = [...presetThemes, ...customThemes];

  const ThemePreview = ({ theme }: { theme: ThemeConfig }) => (
    <div
      className="w-full h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: theme.colors.background,
        borderColor: currentTheme.id === theme.id ? theme.colors.primary : theme.colors.border,
      }}
      onClick={() => switchTheme(theme.id)}
    >
      <div className="h-full flex">
        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.primary }} />
        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.secondary }} />
        <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors.accent }} />
      </div>
      {currentTheme.id === theme.id && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Check className="w-4 h-4" style={{ color: theme.colors.primaryForeground }} />
          </div>
        </div>
      )}
    </div>
  );

  if (showCustomCreator) {
    return (
      <CustomThemeCreator
        onClose={() => setShowCustomCreator(false)}
        onBack={() => setShowCustomCreator(false)}
      />
    );
  }

  return (
    <Card className="w-96 max-h-[80vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Selector
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Theme */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Theme</h3>
          <div className="relative">
            <ThemePreview theme={currentTheme} />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-medium">{currentTheme.name}</span>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </div>

        {/* Preset Themes */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Preset Themes</h3>
          <div className="grid grid-cols-2 gap-3">
            {presetThemes.map((theme) => (
              <div key={theme.id} className="space-y-2">
                <div className="relative">
                  <ThemePreview theme={theme} />
                </div>
                <p className="text-sm font-medium text-center">{theme.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Themes */}
        {customThemes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Custom Themes</h3>
            <div className="grid grid-cols-2 gap-3">
              {customThemes.map((theme) => (
                <div key={theme.id} className="space-y-2">
                  <div className="relative group">
                    <ThemePreview theme={theme} />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomTheme(theme.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-center">{theme.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Custom Theme */}
        <div>
          <Button
            onClick={() => setShowCustomCreator(true)}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Custom Theme
          </Button>
        </div>

        {/* Theme Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Themes are automatically saved to your browser</p>
          <p>• Changes apply instantly with live preview</p>
          <p>• Custom themes can be deleted by hovering over them</p>
        </div>
      </CardContent>
    </Card>
  );
}
