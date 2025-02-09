
import { Map } from "@/components/Map";
import { Fish } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-sage-50">
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-sage-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fish className="w-6 h-6 text-water-600" />
              <h1 className="text-xl font-semibold text-gray-900">Angler's Kit</h1>
            </div>
            <p className="text-sm text-sage-600">Discover Eco-Friendly Fishing Spots</p>
          </div>
        </div>
      </header>
      
      <main className="h-screen">
        <Map />
      </main>
    </div>
  );
};

export default Index;
