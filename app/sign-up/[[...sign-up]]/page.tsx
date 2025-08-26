'use client'

import { useState } from 'react'
import { EnhancedAuthLayout } from '@/components/auth/EnhancedAuthLayout'

export default function SignUpPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')

  return <EnhancedAuthLayout mode={mode} onModeChange={setMode} />
}