import React from "react";
import { SignUp } from "@clerk/react";
import { Mountain } from "lucide-react";

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 via-background to-background">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Mountain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Trek Quest</h1>
            <p className="text-xs text-muted-foreground">Smart Hiking Companion</p>
          </div>
        </div>

        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg border border-border rounded-2xl w-full bg-card",
              headerTitle: "text-foreground font-bold",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium",
              footerActionLink: "text-emerald-600 hover:text-emerald-700 font-medium",
            },
          }}
        />
      </div>
    </div>
  );
}
