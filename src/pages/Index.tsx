
import { MapComponent } from "@/components/Map";
import { Fish, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useLocationStore } from "@/hooks/useGlobalLocation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { getUserLocation } = useLocation();
  const getGlobalLocation = useLocationStore((state) => state.getLocation);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Fish className="w-6 h-6 text-water-600 dark:text-water-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Angler's Kit</h1>
            </div>
            <div className="flex-1 overflow-hidden">
              <p 
                key={currentTipIndex}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-fade-in"
              >
                {tips[currentTipIndex]}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <MapComponent />
      </main>
    </div>
  );
};

export default Index;

