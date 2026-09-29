import React from "react";
import { SignIn } from "@clerk/react";
import { Mountain, Wifi, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isAuthenticated, user } = useAuth();

  // If user already has an active or cached session, immediately go to home/map
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 via-background to-background">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Mountain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Trek Quest</h1>
            <p className="text-xs text-muted-foreground">Smart Hiking Companion</p>
          </div>
        </div>

        {/* First-time login notice */}
        <div className="w-full mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Wifi size={14} className="shrink-0 text-emerald-600" />
          <span>Internet required only for initial sign-in. Once signed in, you can hike 100% offline.</span>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
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

        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Offline session caching active</span>
        </div>
      </div>
    </div>
  );
}

