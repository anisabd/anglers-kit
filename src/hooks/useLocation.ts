
import { useToast } from "@/components/ui/use-toast";

export const useLocation = () => {
  const { toast } = useToast();

  const getUserLocation = () => {
    return new Promise<google.maps.LatLngLiteral>((resolve, reject) => {
      if (navigator.geolocation) {
        toast({
          title: "Location Access",
          description: "Please allow location access to center the map.",
        });

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
              case error.PERMISSION_DENIED:
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out.";
                break;
            }
            toast({
              variant: "destructive",
              title: "Location Error",
              description: errorMessage,
            });
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        const error = new Error("Geolocation is not supported by this browser.");
        toast({
          variant: "destructive",
          title: "Browser Error",
          description: error.message,
        });
        reject(error);
      }
    });
  };

  return { getUserLocation };
};
