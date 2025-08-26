'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { notify } from '@/components/ui/notify'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TestToast() {
  const testSuccess = () => {
    notify.success('Calendar event created successfully!')
  }

  const testError = () => {
    notify.error('Failed to sync calendar. Please try again.')
  }

  const testWarning = () => {
    notify.warning('Some events may have conflicts that need resolution.', {
      action: {
        label: 'Resolve',
        onClick: () => notify.info('Opening conflict resolution...')
      }
    })
  }

  const testInfo = () => {
    notify.info('Syncing calendar data from Google Calendar...')
  }

  const testLoadingWithUpdate = () => {
    const id = notify.loading('Saving calendar settings...')
    
    // Simulate async operation
    setTimeout(() => {
      notify.update(id, 'Settings saved successfully!', true)
    }, 2000)
  }

  const testLoadingWithError = () => {
    const id = notify.loading('Connecting to calendar provider...')
    
    // Simulate async operation that fails
    setTimeout(() => {
      notify.update(id, 'Failed to connect to calendar provider', false)
    }, 2000)
  }

  const testMultiple = () => {
    notify.success('First notification')
    setTimeout(() => notify.info('Second notification'), 500)
    setTimeout(() => notify.warning('Third notification'), 1000)
  }

  const testDismiss = () => {
    const id = notify.info('This notification will auto-dismiss in 2 seconds', { 
      duration: 10000 // Long duration
    })
    
    setTimeout(() => {
      notify.dismiss(id)
    }, 2000)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Toast Notification System Test</CardTitle>
        <CardDescription>
          Test the new Sonner-based toast notification system with token-only theming
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={testSuccess} variant="default">
            Test Success Toast
          </Button>
          
          <Button onClick={testError} variant="destructive">
            Test Error Toast
          </Button>
          
          <Button onClick={testWarning} variant="outline">
            Test Warning Toast (with Action)
          </Button>
          
          <Button onClick={testInfo} variant="secondary">
            Test Info Toast
          </Button>
          
          <Button onClick={testLoadingWithUpdate} className="bg-blue-600 hover:bg-blue-700">
            Test Loading → Success
          </Button>
          
          <Button onClick={testLoadingWithError} className="bg-orange-600 hover:bg-orange-700">
            Test Loading → Error
          </Button>
          
          <Button onClick={testMultiple} variant="outline">
            Test Multiple Toasts
          </Button>
          
          <Button onClick={testDismiss} variant="ghost">
            Test Dismiss Toast
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-2">What to verify:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Toasts appear in top-right corner with proper z-index</li>
            <li>• Token-only theming (bg-card, text-foreground, etc.)</li>
            <li>• Success toasts show for 4 seconds</li>
            <li>• Error toasts show for 6 seconds</li>
            <li>• Warning toasts show for 5 seconds with action button</li>
            <li>• Loading toasts can be updated to success/error</li>
            <li>• Multiple toasts stack properly</li>
            <li>• Manual dismiss works correctly</li>
          </ul>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => notify.dismissAll()} 
            variant="outline" 
            size="sm"
          >
            Dismiss All Toasts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}