'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Keyboard } from 'lucide-react';
import * as React from 'react';

export function ShortcutSettings() {
  const { settings, updateCategory, resetCategory } = useSettingsContext();
  const shortcuts = settings.shortcuts;
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [newBinding, setNewBinding] = React.useState('');

  const toggleShortcuts = () => {
    updateCategory('shortcuts', { enabled: !shortcuts.enabled });
  };

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLInputElement>, _action: string) => {
    e.preventDefault();
    const key = e.key;
    const modifiers = [];

    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.metaKey) modifiers.push('cmd');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');

    const binding =
      modifiers.length > 0 ? `${modifiers.join('+')}+${key.toLowerCase()}` : key.toLowerCase();

    setNewBinding(binding);
  };

  const saveBinding = (action: string) => {
    if (newBinding) {
      updateCategory('shortcuts', {
        customBindings: {
          ...shortcuts.customBindings,
          [action]: newBinding,
        },
      });
      setEditingKey(null);
      setNewBinding('');
    }
  };

  const resetBinding = (action: string) => {
    const { [action]: _, ...rest } = shortcuts.customBindings;
    updateCategory('shortcuts', { customBindings: rest });
  };

  const getBinding = (action: string): string => {
    return (
      shortcuts.customBindings[action] ||
      shortcuts.defaultBindings[action as keyof typeof shortcuts.defaultBindings]
    );
  };

  const shortcutActions = [
    { key: 'newEvent', label: 'New Event', description: 'Create a new calendar event' },
    { key: 'search', label: 'Search', description: 'Open search/command palette' },
    { key: 'toggleView', label: 'Toggle View', description: 'Switch between calendar views' },
    { key: 'nextPeriod', label: 'Next Period', description: 'Navigate to next time period' },
    {
      key: 'prevPeriod',
      label: 'Previous Period',
      description: 'Navigate to previous time period',
    },
    { key: 'today', label: 'Go to Today', description: 'Jump to current date' },
    { key: 'delete', label: 'Delete', description: 'Delete selected item' },
    { key: 'escape', label: 'Cancel/Close', description: 'Cancel action or close dialog' },
    { key: 'save', label: 'Save', description: 'Save current changes' },
    { key: 'settings', label: 'Open Settings', description: 'Open settings dialog' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Keyboard Shortcuts</h3>

        <div className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shortcuts" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Enable Keyboard Shortcuts
              </Label>
              <p className="text-sm text-muted-foreground">
                Use keyboard shortcuts for quick actions
              </p>
            </div>
            <Switch
              id="shortcuts"
              checked={shortcuts.enabled}
              onCheckedChange={toggleShortcuts}
              aria-label="Toggle keyboard shortcuts"
            />
          </div>

          {shortcuts.enabled && (
            <>
              {/* Shortcuts List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Shortcut Bindings</Label>
                  <Button variant="outline" size="sm" onClick={() => resetCategory('shortcuts')}>
                    Reset All to Default
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium">Action</th>
                        <th className="text-left p-3 text-sm font-medium">Shortcut</th>
                        <th className="text-right p-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortcutActions.map((action) => (
                        <tr key={action.key} className="border-b last:border-0">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-sm">{action.label}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {editingKey === action.key ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={newBinding}
                                  onKeyDown={(e) => handleKeyCapture(e, action.key)}
                                  placeholder="Press keys..."
                                  className="w-32 h-8"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveBinding(action.key)}
                                  disabled={!newBinding}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingKey(null);
                                    setNewBinding('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded">
                                {getBinding(action.key)}
                              </kbd>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {editingKey !== action.key && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingKey(action.key);
                                    setNewBinding(getBinding(action.key));
                                  }}
                                >
                                  Edit
                                </Button>
                                {shortcuts.customBindings[action.key] && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => resetBinding(action.key)}
                                  >
                                    Reset
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Click "Edit" to customize a shortcut. Press the key combination you want to use.
                  Use modifier keys (Cmd/Ctrl, Alt, Shift) for complex shortcuts.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
