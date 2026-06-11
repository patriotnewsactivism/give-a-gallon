import { Fuel, Check, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function DonationSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="size-20 rounded-full bg-fuel/10 mx-auto mb-6 flex items-center justify-center">
          <Check className="size-10 text-fuel" />
        </div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FUELED UP! \u26fd
        </h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Your donation went through! The activist will receive your gallons.
          Thank you for fueling the fight.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
            asChild
          >
            <Link to="/explore">
              <Fuel className="size-4 mr-1" />
              Browse More Activists
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
