'use client';

import { CustomThemeCreator } from '@/components/theme/custom-theme-creator';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Eye, Palette, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function ThemesPage() {
  const router = useRouter();
  const [showThemeSelector, setShowThemeSelector] = useState(true);
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">Theme Manager</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showThemeSelector ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowThemeSelector(true);
                  setShowCustomCreator(false);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Browse Themes
              </Button>
              <Button
                variant={showCustomCreator ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowThemeSelector(false);
                  setShowCustomCreator(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Theme Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Preset Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose from carefully crafted preset themes including Light, Dark, High Contrast,
                and more accessibility-focused options.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Custom Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create your own themes with live preview, color palette customization, and real-time
                updates to see changes instantly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-secondary" />
                Persistent Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All themes are automatically saved to your browser and sync across sessions. Export
                and import theme configurations.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Theme Interface */}
        <div className="flex justify-center">
          {showThemeSelector && <ThemeSelector onClose={() => setShowThemeSelector(false)} />}

          {showCustomCreator && (
            <CustomThemeCreator
              onClose={() => setShowCustomCreator(false)}
              onBack={() => {
                setShowCustomCreator(false);
                setShowThemeSelector(true);
              }}
            />
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use Themes</CardTitle>
              <CardDescription>Get the most out of the advanced theme system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">🎨 Browsing Themes</h4>
                <p className="text-sm text-muted-foreground">
                  Click on any theme preview to apply it instantly. The current theme is highlighted
                  with a checkmark.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">✨ Creating Custom Themes</h4>
                <p className="text-sm text-muted-foreground">
                  Use the custom theme creator to design your own color palette. All changes are
                  previewed in real-time.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">🗑️ Managing Custom Themes</h4>
                <p className="text-sm text-muted-foreground">
                  Hover over custom themes to see the delete button. Preset themes cannot be
                  deleted.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">♿ Accessibility</h4>
                <p className="text-sm text-muted-foreground">
                  High contrast themes are available for better accessibility. All themes meet WCAG
                  color contrast requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
