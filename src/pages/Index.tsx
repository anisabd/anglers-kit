
import { MapComponent } from "@/components/Map";
import { Fish } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useLocationStore } from "@/hooks/useGlobalLocation";

const Index = () => {
  const { getUserLocation } = useLocation();
  const getGlobalLocation = useLocationStore((state) => state.getLocation);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    "Always check local fishing regulations before casting",
    "Practice catch and release for sustainable fishing",
    "Keep a safe distance from other anglers",
    "Clean your equipment to prevent spreading invasive species",
    "Remember to bring your fishing license"
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
    }, 10000); // Changed from 5000 to 10000 milliseconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-sage-50">
      <header className="absolute top-0 left-0 right-0 z-10 bg-white shadow-sm">
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
      
      <main className="h-screen">
        <MapComponent />
      </main>
    </div>
  );
};

export default Index;
