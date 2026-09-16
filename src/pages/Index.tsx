import { GameProvider } from "@/lib/GameContext";
import Dashboard from "@/components/game/Dashboard";
import WorkButton from "@/components/game/WorkButton";
import BusinessList from "@/components/game/BusinessList";
import AssetGallery from "@/components/game/AssetGallery";
import InvestmentPanel from "@/components/game/InvestmentPanel";
import FinancePanel from "@/components/game/FinancePanel";
import CareerPanel from "@/components/game/CareerPanel";
import LedgerPanel from "@/components/game/LedgerPanel";
import BackgroundScene from "@/components/game/BackgroundScene";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "career", label: "Career" },
  { value: "businesses", label: "Business" },
  { value: "assets", label: "Lifestyle" },
  { value: "investments", label: "Invest" },
  { value: "finance", label: "Money" },
  { value: "ledger", label: "Review" },
];

export default function Index() {
  return (
    <GameProvider>
      <div className="min-h-screen font-sans relative">
        <BackgroundScene />
        <div className="relative z-10">
          <Dashboard />

          <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">
            <Tabs defaultValue="career" className="w-full">
              <TabsList className="w-full grid grid-cols-6 bg-secondary h-10 rounded-lg p-1 mb-4">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="rounded-md text-[11px] data-[state=active]:bg-surface data-[state=active]:shadow-sm"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="career"><CareerPanel /></TabsContent>
              <TabsContent value="businesses"><BusinessList /></TabsContent>
              <TabsContent value="assets"><AssetGallery /></TabsContent>
              <TabsContent value="investments"><InvestmentPanel /></TabsContent>
              <TabsContent value="finance"><FinancePanel /></TabsContent>
              <TabsContent value="ledger"><LedgerPanel /></TabsContent>
            </Tabs>
          </div>

          <WorkButton />
        </div>
      </div>
    </GameProvider>
  );
}
