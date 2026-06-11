import { Fuel, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function DonationCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="size-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
          <Fuel className="size-10 text-muted-foreground" />
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Donation Cancelled
        </h1>
        <p className="text-muted-foreground mb-6">
          No worries — no charge was made. You can always come back and give a gallon later.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
            asChild
          >
            <Link to="/explore">
              Browse Activists
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="size-4 mr-1" />
              Back Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
