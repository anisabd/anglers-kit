
import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

export const useLocation = () => {
  const { toast } = useToast();

  const getUserLocation = useCallback(() => {
    return new Promise<google.maps.LatLngLiteral>(async (resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation is not supported by this browser.");
        toast({
          variant: "destructive",
          title: "Browser Error",
          description: error.message,
        });
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          resolve(location);
          toast({
            title: "Location Found",
            description: "Map centered on your location.",
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          let errorMessage = "Could not access your location.";
          
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = "Location access was denied. Please enable location access in your browser settings and try again.";
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = "Location information is unavailable. Please try again.";
              break;
            case 3: // TIMEOUT
              errorMessage = "Location request timed out. Please try again.";
              break;
          }
          
          toast({
            variant: "destructive",
            title: "Location Error",
            description: errorMessage,
            duration: 10000,
          });
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [toast]);

  return { getUserLocation };
};
