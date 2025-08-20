import { SignIn } from "@clerk/nextjs";
import { GlassCard } from "@/components/glass";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-glass-accent/10 via-transparent to-glass-secondary/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-glass-accent/20 blur-3xl animate-liquid-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-glass-secondary/20 blur-3xl animate-liquid-float" style={{ animationDelay: '10s' }} />
      </div>
      
      <GlassCard 
        className="p-8 max-w-md w-full"
        variant="heavy"
        liquid
        aurora
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-glass-accent to-glass-secondary bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-oklch-gray-600">
            Sign in to continue to LinearTime
          </p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "glass bg-glass-accent/20 hover:bg-glass-accent/30 border-glass-accent/30",
              formFieldInput: "glass-light",
              footerActionLink: "text-glass-accent hover:text-glass-accent/80",
              dividerLine: "bg-glass-border/30",
              dividerText: "text-oklch-gray-600",
              socialButtonsBlockButton: "glass hover:glass-heavy border-glass-border/30",
              socialButtonsBlockButtonText: "font-medium",
              identityPreviewEditButton: "text-glass-accent hover:text-glass-accent/80",
              formFieldLabel: "text-oklch-gray-700",
            },
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </GlassCard>
    </div>
  );
}