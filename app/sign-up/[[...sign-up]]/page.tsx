import { SignUp } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>
      
      <Card className="p-8 max-w-md w-full bg-card/95 backdrop-blur-sm border-border shadow-2xl transition-all hover:shadow-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get Started
          </h1>
          <p className="text-muted-foreground">
            Create your LinearTime account
          </p>
        </div>
        
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all",
              formFieldInput: "bg-background border-input",
              footerActionLink: "text-primary hover:text-primary/80",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              socialButtonsBlockButton: "bg-card hover:bg-accent border-border shadow-md hover:shadow-lg transition-all",
              socialButtonsBlockButtonText: "font-medium",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formFieldLabel: "text-foreground",
            },
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </Card>
    </div>
  );
}