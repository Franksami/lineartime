'use client'

import { useState } from 'react'
import { EnhancedAuthLayout } from '@/components/auth/EnhancedAuthLayout'

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return <EnhancedAuthLayout mode={mode} onModeChange={setMode} />
}