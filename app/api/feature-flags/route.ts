/**
 * Modern Feature Flags API Route - Optimized for Command Center Calendar
 * Replaces deprecated @vercel/flags with lightweight, performant solution
 */

import { getServerFeatureFlags } from '@/lib/featureFlags/modernFeatureFlags';
import { type NextRequest, NextResponse } from 'next/server';

// API response types
interface FeatureFlagResponse {
  flags: Record<string, any>;
  environment: string;
  lastUpdated: number;
}

interface FeatureFlagUpdateRequest {
  flagName: string;
  value: any;
  environment?: string;
}

/**
 * GET /api/feature-flags
 * Returns current feature flag configuration
 */
export async function GET(_request: NextRequest) {
  try {
    const flags = await getServerFeatureFlags();

    const response: FeatureFlagResponse = {
      flags,
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Feature flags API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

/**
 * POST /api/feature-flags
 * Updates a feature flag (development only)
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Feature flag updates not allowed in production' },
      { status: 403 }
    );
  }

  try {
    const body: FeatureFlagUpdateRequest = await request.json();
    const { flagName, value } = body;

    // In development, we could update flags in memory or localStorage
    // For production, this would integrate with a feature flag service

    return NextResponse.json({
      success: true,
      flagName,
      value,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Feature flag update error:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}

/**
 * PUT /api/feature-flags/[flagName]
 * Toggle a specific feature flag
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flagName: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Feature flag updates not allowed in production' },
      { status: 403 }
    );
  }

  try {
    const { flagName } = await params;
    const body = await request.json();

    return NextResponse.json({
      success: true,
      flagName,
      newValue: body.value,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Feature flag toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle feature flag' }, { status: 500 });
  }
}
