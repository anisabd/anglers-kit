
import { create } from 'zustand';
import { useToast } from "@/components/ui/use-toast";

interface LocationState {
  location: google.maps.LatLngLiteral | null;
  setLocation: (location: google.maps.LatLngLiteral) => void;
  getLocation: () => Promise<google.maps.LatLngLiteral>;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  setLocation: (location) => set({ location }),
  getLocation: async () => {
    const state = useLocationStore.getState();
    if (state.location) {
      return state.location;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          state.setLocation(location);
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}));
