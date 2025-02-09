
import { MapComponent } from "@/components/Map";
import { useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useLocationStore } from "@/hooks/useGlobalLocation";

const Index = () => {
  const { getUserLocation } = useLocation();
  const getGlobalLocation = useLocationStore((state) => state.getLocation);

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

  return (
    <div className="h-screen w-full">
      <MapComponent />
    </div>
  );
};

export default Index;

