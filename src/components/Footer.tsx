import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/30 py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-xs">
              A crowdsourcing &amp; crowdfunding platform by{" "}
              <span className="text-foreground font-medium">We The People News</span>
              {" "}— designed for those always on the go.
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
            © {new Date().getFullYear()} Give-A-Gallon · A <span className="text-foreground/70">We The People News</span> platform · <a href="https://fuel.wtpnews.org" className="hover:text-foreground transition-colors">fuel.wtpnews.org</a>
          </p>
          <p className="text-xs text-muted-foreground">
            "One gallon can change someone's day. Many gallons can change a life."
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
