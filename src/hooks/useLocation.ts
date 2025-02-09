
import { useToast } from "@/components/ui/use-toast";

export const useLocation = () => {
  const { toast } = useToast();

  const getUserLocation = () => {
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

      // Check permission status first
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permissionStatus.state === 'denied') {
          toast({
            variant: "destructive",
            title: "Location Access Required",
            description: "Please enable location access in your browser settings and try again.",
          });
          reject(new Error("Location permission denied"));
          return;
        }

        if (permissionStatus.state === 'prompt') {
          toast({
            title: "Location Access",
            description: "Please allow location access when prompted to center the map.",
          });
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
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = "Location information unavailable.";
                break;
              case 3: // TIMEOUT
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
      } catch (error) {
        console.error("Error checking location permission:", error);
        toast({
          variant: "destructive",
          title: "Permission Error",
          description: "Unable to check location permissions. Please try again.",
        });
        reject(error);
      }
    });
  };

  return { getUserLocation };
};
