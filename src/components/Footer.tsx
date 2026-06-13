import { Logo } from "./Logo";

/**
 * Footer — shared brand footer used across public pages.
 * Keeps the gas-gauge mark + tagline consistent everywhere.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/30 py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Give a Gallon. Fuel the movement.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
