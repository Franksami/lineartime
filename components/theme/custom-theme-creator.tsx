'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ThemeConfig, useThemeManager } from '@/lib/theme-manager';
import { ArrowLeft, Palette, Save } from 'lucide-react';
import { useState } from 'react';

interface CustomThemeCreatorProps {
  onClose: () => void;
  onBack: () => void;
}

export function CustomThemeCreator({ onClose, onBack }: CustomThemeCreatorProps) {
  const { currentTheme, saveCustomTheme, applyTheme } = useThemeManager();
  const [themeName, setThemeName] = useState('');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    ...currentTheme,
    id: `custom-${Date.now()}`,
    name: '',
  });

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    const updatedTheme = {
      ...themeConfig,
      colors: {
        ...themeConfig.colors,
        [colorKey]: value,
      },
    };
    setThemeConfig(updatedTheme);
    // Apply theme for live preview
    applyTheme(updatedTheme);
  };

  const handleTypographyChange = (key: keyof ThemeConfig['typography'], value: string) => {
    const updatedTheme = {
      ...themeConfig,
      typography: {
        ...themeConfig.typography,
        [key]: value,
      },
    };
    setThemeConfig(updatedTheme);
    applyTheme(updatedTheme);
  };

  const handleLayoutChange = (key: keyof ThemeConfig['layout'], value: string) => {
    const updatedTheme = {
      ...themeConfig,
      layout: {
        ...themeConfig.layout,
        [key]: value,
      },
    };
    setThemeConfig(updatedTheme);
    applyTheme(updatedTheme);
  };

  const handleSave = () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const finalTheme = {
      ...themeConfig,
      name: themeName,
    };

    saveCustomTheme(finalTheme);
    onClose();
  };

  const ColorPicker = ({
    label,
    colorKey,
    value,
  }: { label: string; colorKey: keyof ThemeConfig['colors']; value: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value.includes('oklch') ? '#3b82f6' : value}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-12 h-10 p-1 border rounded"
        />
        <Input
          value={value}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          placeholder="oklch(0.5 0.1 200) or #hex"
          className="flex-1"
        />
      </div>
    </div>
  );

  return (
    <Card className="w-[500px] max-h-[80vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Create Custom Theme
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Name */}
        <div className="space-y-2">
          <Label htmlFor="theme-name">Theme Name</Label>
          <Input
            id="theme-name"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="Enter theme name..."
          />
        </div>

        {/* Theme Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div
            className="w-full h-20 rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: themeConfig.colors.background,
              borderColor: themeConfig.colors.border,
            }}
          >
            <div className="h-full flex">
              <div
                className="w-1/4 h-full"
                style={{ backgroundColor: themeConfig.colors.primary }}
              />
              <div
                className="w-1/4 h-full"
                style={{ backgroundColor: themeConfig.colors.secondary }}
              />
              <div
                className="w-1/4 h-full"
                style={{ backgroundColor: themeConfig.colors.accent }}
              />
              <div className="w-1/4 h-full" style={{ backgroundColor: themeConfig.colors.muted }} />
            </div>
          </div>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <ColorPicker
                label="Background"
                colorKey="background"
                value={themeConfig.colors.background}
              />
              <ColorPicker
                label="Foreground"
                colorKey="foreground"
                value={themeConfig.colors.foreground}
              />
              <ColorPicker label="Primary" colorKey="primary" value={themeConfig.colors.primary} />
              <ColorPicker
                label="Primary Foreground"
                colorKey="primaryForeground"
                value={themeConfig.colors.primaryForeground}
              />
              <ColorPicker
                label="Secondary"
                colorKey="secondary"
                value={themeConfig.colors.secondary}
              />
              <ColorPicker
                label="Secondary Foreground"
                colorKey="secondaryForeground"
                value={themeConfig.colors.secondaryForeground}
              />
              <ColorPicker label="Accent" colorKey="accent" value={themeConfig.colors.accent} />
              <ColorPicker
                label="Accent Foreground"
                colorKey="accentForeground"
                value={themeConfig.colors.accentForeground}
              />
              <ColorPicker label="Muted" colorKey="muted" value={themeConfig.colors.muted} />
              <ColorPicker
                label="Muted Foreground"
                colorKey="mutedForeground"
                value={themeConfig.colors.mutedForeground}
              />
              <ColorPicker label="Border" colorKey="border" value={themeConfig.colors.border} />
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select
                  value={themeConfig.typography.fontSize}
                  onValueChange={(value: 'sm' | 'md' | 'lg') =>
                    handleTypographyChange('fontSize', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Line Height</Label>
                <Select
                  value={themeConfig.typography.lineHeight}
                  onValueChange={(value: 'tight' | 'normal' | 'relaxed') =>
                    handleTypographyChange('lineHeight', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sans Serif Font</Label>
                <Input
                  value={themeConfig.typography.fontSans}
                  onChange={(e) => handleTypographyChange('fontSans', e.target.value)}
                  placeholder="Font family for sans-serif text"
                />
              </div>

              <div className="space-y-2">
                <Label>Serif Font</Label>
                <Input
                  value={themeConfig.typography.fontSerif}
                  onChange={(e) => handleTypographyChange('fontSerif', e.target.value)}
                  placeholder="Font family for serif text"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                  value={themeConfig.layout.radius}
                  onChange={(e) => handleLayoutChange('radius', e.target.value)}
                  placeholder="e.g., 0.5rem, 8px"
                />
              </div>

              <div className="space-y-2">
                <Label>Spacing</Label>
                <Select
                  value={themeConfig.layout.spacing}
                  onValueChange={(value: 'compact' | 'normal' | 'spacious') =>
                    handleLayoutChange('spacing', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Theme
          </Button>
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Colors support both OKLCH and hex formats</p>
          <p>• Changes are applied instantly for live preview</p>
          <p>• Theme will be saved to your browser storage</p>
        </div>
      </CardContent>
    </Card>
  );
}
