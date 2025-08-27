'use client';

import { EnhancedAuthLayout } from '@/components/auth/EnhancedAuthLayout';
import { useState } from 'react';

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return <EnhancedAuthLayout mode={mode} onModeChange={setMode} />;
}
