
import { MapComponent } from "@/components/Map";
import { Fish, Home, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useLocationStore } from "@/hooks/useGlobalLocation";
import { Dashboard } from "@/components/Dashboard";
import { Link } from "react-router-dom";

const Index = () => {
  const { getUserLocation } = useLocation();
  const getGlobalLocation = useLocationStore((state) => state.getLocation);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeView, setActiveView] = useState<'dashboard' | 'map'>('dashboard');

  const tips = [
    "Always check local fishing regulations before casting",
    "Practice catch and release for sustainable fishing",
    "Keep a safe distance from other anglers",
    "Clean your equipment to prevent spreading invasive species",
    "Remember to bring your fishing license",
    "Check weather conditions before heading out",
    "Use appropriate bait for your target species",
    "Bring plenty of water and stay hydrated",
    "Wear polarized sunglasses to reduce glare",
    "Keep a first aid kit in your tackle box",
    "Learn the proper knots for your fishing line",
    "Handle fish with wet hands to protect their slime coat",
    "Avoid fishing near swimming areas",
    "Pack out what you pack in - leave no trace",
    "Store hooks safely to prevent accidents",
    "Monitor tide schedules for coastal fishing",
    "Match your tackle to your target fish size",
    "Respect private property boundaries",
    "Study fish feeding patterns for better success",
    "Keep noise levels down to avoid spooking fish",
    "Bring appropriate clothing for weather changes",
    "Learn to read water currents and structures",
    "Share the space respectfully with wildlife",
    "Keep an emergency communication device handy"
  ];

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getUserLocation();
        if (location) {
          await getGlobalLocation();
        }
      } catch (error) {
        console.error("Error initializing location:", error);
      }
    };

    initializeLocation();
  }, [getUserLocation, getGlobalLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => 
        prevIndex === tips.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-sage-50 flex">
      <div className="w-16 bg-white shadow-lg flex flex-col items-center py-4 fixed h-full">
        <Link
          to="/"
          className={`p-3 rounded-lg mb-2 hover:bg-gray-100 ${
            activeView === 'dashboard' ? 'bg-gray-100' : ''
          }`}
          onClick={() => setActiveView('dashboard')}
        >
          <Home className="w-6 h-6 text-gray-700" />
        </Link>
        <Link
          to="/"
          className={`p-3 rounded-lg hover:bg-gray-100 ${
            activeView === 'map' ? 'bg-gray-100' : ''
          }`}
          onClick={() => setActiveView('map')}
        >
          <Map className="w-6 h-6 text-gray-700" />
        </Link>
      </div>

      <div className="flex-1 ml-16">
        <header className="fixed top-0 left-16 right-0 z-50 bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Fish className="w-6 h-6 text-water-600" />
                <h1 className="text-xl font-semibold text-gray-900">Angler's Kit</h1>
              </div>
              <div className="flex-1 overflow-hidden">
                <p 
                  key={currentTipIndex}
                  className="text-sm font-medium text-gray-600 animate-fade-in"
                >
                  {tips[currentTipIndex]}
                </p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="pt-16">
          {activeView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <div className="h-[calc(100vh-4rem)]">
              <MapComponent />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
