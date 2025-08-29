import { PricingTable } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Command Center Calendar',
  description: 'Choose the perfect plan for your scheduling needs with Clerk integrated billing',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upgrade your scheduling experience with powerful features designed for productivity. All
            plans include our signature horizontal timeline layout.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Clerk's PricingTable component handles all billing logic */}
          <PricingTable />
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Need enterprise features?{' '}
            <a href="mailto:support@lineartime.app" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground mt-4">
            <span>✓ Cancel anytime</span>
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ Secure payments managed by Clerk + Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
