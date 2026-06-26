import { useConvexAuth } from "convex/react";
import { ArrowRight, BarChart3, Menu, Star, Trophy, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Button } from "./ui/button";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md shadow-sm shadow-black/40">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Logo wordmarkClassName="hidden sm:inline" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              asChild
            >
              <Link to="/explore">Browse</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              asChild
            >
              <Link to="/impact">
                <BarChart3 className="size-3.5 mr-1" />
                Impact
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              asChild
            >
              <Link to="/leaderboard">
                <Trophy className="size-3.5 mr-1" />
                Leaderboard
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              asChild
            >
              <Link to="/membership">
                <Star className="size-3.5 mr-1" />
                Membership
              </Link>
            </Button>

            {isLoading ? null : isAuthenticated ? (
              <Button
                size="sm"
                className="ml-2 bg-fuel text-fuel-foreground hover:bg-fuel/90 shadow-md shadow-fuel/25"
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
                    className="ml-2 bg-fuel text-fuel-foreground hover:bg-fuel/90 shadow-md shadow-fuel/25 font-semibold"
                    asChild
                  >
                    <Link to="/signup">Start a Campaign</Link>
                  </Button>
                </>
              )
            )}
          </nav>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Mobile toggle */}
          <button
            type="button"
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 pt-2 border-t border-border/30 flex flex-col gap-1">
            <Link
              to="/explore"
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Browse Campaigns
            </Link>
            <Link
              to="/impact"
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 flex items-center gap-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              <BarChart3 className="size-3.5" /> Impact Dashboard
            </Link>
            <Link
              to="/leaderboard"
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 flex items-center gap-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              <Trophy className="size-3.5" /> Leaderboard
            </Link>
            <Link
              to="/membership"
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 flex items-center gap-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              <Star className="size-3.5" /> Membership
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="mt-1 px-3 py-2.5 text-sm font-semibold text-fuel bg-fuel/10 rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="mt-1 px-3 py-2.5 text-sm font-semibold text-fuel-foreground bg-fuel rounded-md text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Start a Campaign →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
