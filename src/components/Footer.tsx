import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <>
      {/* Pre-footer CTA */}
      <div className="border-t border-fuel/20 bg-fuel/[0.04] py-10">
        <div className="container text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-fuel mb-2">Ready to fuel the fight?</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Every gallon gets someone there.
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-fuel text-fuel-foreground font-semibold text-sm shadow-lg shadow-fuel/25 hover:bg-fuel/90 transition-colors">
              Start a Campaign
            </Link>
            <Link to="/explore" className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg border border-border/60 text-sm font-medium hover:border-fuel/40 hover:text-fuel transition-colors">
              Fuel an Activist
            </Link>
          </div>
        </div>
      </div>

      {/* Footer grid */}
      <footer className="border-t border-border/30 py-10">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <Logo />
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-xs">
                A crowdsourcing &amp; crowdfunding platform by{" "}
                <a href="https://www.wtpnews.org" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-fuel transition-colors">We The People News</a>
                {" "}— designed for those always on the go. A sister platform to{" "}
                <a href="https://www.civilrightshub.org" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-fuel transition-colors">Civil Rights Hub</a>.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore" className="hover:text-foreground transition-colors">Browse Campaigns</Link></li>
                <li><Link to="/impact" className="hover:text-foreground transition-colors">Impact Dashboard</Link></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Start a Campaign</Link></li>
                <li><Link to="/membership" className="hover:text-foreground transition-colors">Membership</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Causes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore?category=investigative-journalism" className="hover:text-foreground transition-colors">Journalism</Link></li>
                <li><Link to="/explore?category=activism" className="hover:text-foreground transition-colors">Activism</Link></li>
                <li><Link to="/explore?category=veterans" className="hover:text-foreground transition-colors">Veterans</Link></li>
                <li><Link to="/explore?category=constitutional-rights" className="hover:text-foreground transition-colors">Rights Cases</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Trust</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="text-xs">5% platform fee</span></li>
                <li><span className="text-xs">~3% Stripe processing</span></li>
                <li><span className="text-xs">~92% to creators</span></li>
                <li><Link to="/impact" className="hover:text-foreground transition-colors text-xs">Full transparency →</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Give-A-Gallon · A{" "}
              <a href="https://www.wtpnews.org" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-fuel transition-colors">We The People News</a>
              {" "}platform ·{" "}
              <a href="https://www.civilrightshub.org" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-fuel transition-colors">Civil Rights Hub</a>
              {" "}· <a href="https://giveagallon.org" className="hover:text-foreground transition-colors">giveagallon.org</a>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
