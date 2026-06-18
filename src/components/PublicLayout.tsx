import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PatrioticBackground } from "./PatrioticBackground";
import { SocialProofBar } from "./SocialProofBar";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <PatrioticBackground />
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <SocialProofBar />
    </div>
  );
}
