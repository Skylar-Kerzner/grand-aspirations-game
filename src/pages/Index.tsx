import { GameProvider } from "@/lib/GameContext";
import Dashboard from "@/components/game/Dashboard";
import WorkButton from "@/components/game/WorkButton";
import BusinessList from "@/components/game/BusinessList";
import AssetGallery from "@/components/game/AssetGallery";
import InvestmentPanel from "@/components/game/InvestmentPanel";
import FinancePanel from "@/components/game/FinancePanel";
import CareerPanel from "@/components/game/CareerPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Index() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-background font-sans">
        <Dashboard />

        <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">
          <Tabs defaultValue="career" className="w-full">
            <TabsList className="w-full grid grid-cols-5 bg-secondary h-10 rounded-lg p-1 mb-4">
              <TabsTrigger
                value="career"
                className="rounded-md text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Career
              </TabsTrigger>
              <TabsTrigger
                value="businesses"
                className="rounded-md text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Business
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="rounded-md text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Assets
              </TabsTrigger>
              <TabsTrigger
                value="investments"
                className="rounded-md text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Invest
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="rounded-md text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
              >
                Finance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="career">
              <CareerPanel />
            </TabsContent>
            <TabsContent value="businesses">
              <BusinessList />
            </TabsContent>
            <TabsContent value="assets">
              <AssetGallery />
            </TabsContent>
            <TabsContent value="investments">
              <InvestmentPanel />
            </TabsContent>
            <TabsContent value="finance">
              <FinancePanel />
            </TabsContent>
          </Tabs>
        </div>

        <WorkButton />
      </div>
    </GameProvider>
  );
}
