import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // OAuth redirects; if it returns we navigate.
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-hero p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" aria-label="Back to home">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Logo />
        </div>

        <div className="panel-elevated p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sign in to OriginLab
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick up where you left off, or start a new experiment plan.
          </p>

          <Button
            onClick={handleGoogle}
            disabled={submitting}
            size="lg"
            variant="outline"
            className="mt-7 w-full justify-center gap-3 border-border-strong bg-secondary text-foreground hover:bg-surface-3"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Auth secured by Lovable Cloud
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.7 2.5 2.5 6.7 2.5 12s4.2 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.3 0-.6-.1-1.1-.2-2H12z" />
    </svg>
  );
}
