import { useConvexAuth } from "convex/react";
import { ArrowRight, Fuel, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="container">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="size-8 rounded-lg bg-fuel/10 border border-fuel/20 flex items-center justify-center">
              <Fuel className="size-4 text-fuel" />
            </div>
            <span
              className="font-bold text-sm tracking-wide hidden sm:inline"
              style={{ fontFamily: "var(--font-display)" }}
            >
              GIVE A GALLON
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/explore">Browse</Link>
            </Button>

            {isLoading ? null : isAuthenticated ? (
              <Button
                size="sm"
                className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
                asChild
              >
                <Link to="/dashboard">
                  Dashboard
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            ) : (
              !isAuthPage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
                    asChild
                  >
                    <Link to="/signup">Start Receiving</Link>
                  </Button>
                </>
              )
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 pt-2 border-t border-border/30 flex flex-col gap-2">
            <Link
              to="/explore"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
              onClick={() => setMobileOpen(false)}
            >
              Browse Activists
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-3 py-2 text-sm font-medium text-fuel"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 text-sm font-medium text-fuel"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Receiving →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
