'use client';

import { EnhancedAuthLayout } from '@/components/auth/EnhancedAuthLayout';
import { useState } from 'react';

export default function SignUpPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  return <EnhancedAuthLayout mode={mode} onModeChange={setMode} />;
}
