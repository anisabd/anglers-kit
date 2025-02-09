
import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

export const useLocation = () => {
  const { toast } = useToast();

  const getUserLocation = useCallback(() => {
    return new Promise<google.maps.LatLngLiteral>((resolve, reject) => {
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

      const geo = navigator.geolocation;
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      const success = (position: GeolocationPosition) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        resolve(location);
        toast({
          title: "Location Found",
          description: "Map centered on your location.",
        });
      };

      const error = (error: GeolocationPositionError) => {
        console.error("Error getting user location:", error);
        let errorMessage = "Could not access your location.";
        
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location access in your browser settings and try again.";
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again.";
            break;
          case GeolocationPositionError.TIMEOUT:
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
      };

      geo.getCurrentPosition(success, error, options);
    });
  }, [toast]);

  return { getUserLocation };
};
