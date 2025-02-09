
import { create } from 'zustand';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LocationState {
  location: google.maps.LatLngLiteral | null;
  setLocation: (location: google.maps.LatLngLiteral) => void;
  getLocation: () => Promise<google.maps.LatLngLiteral>;
}

const getLocationFromOpenCage = async (position: GeolocationPosition): Promise<google.maps.LatLngLiteral> => {
  console.log('Attempting to get location from OpenCage...');
  const { data, error } = await supabase.functions.invoke('get-location', {
    body: {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
  });

  if (error) {
    console.error('OpenCage error:', error);
    throw new Error('OpenCage geocoding failed');
  }

  console.log('OpenCage response:', data);
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
};

const getLocationFromGoogleMaps = async (position: GeolocationPosition): Promise<google.maps.LatLngLiteral> => {
  console.log('Attempting to get location from Google Maps...');
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    const latLng = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    geocoder.geocode({ location: latLng }, (results, status) => {
      console.log('Google Maps geocoding status:', status);
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        console.log('Google Maps location found:', results[0]);
        resolve(latLng);
      } else {
        console.error('Google Maps geocoding failed:', status);
        reject(new Error('Google Maps geocoding failed'));
      }
    });
  });
};

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  setLocation: (location) => set({ location }),
  getLocation: async () => {
    const state = useLocationStore.getState();
    if (state.location) {
      console.log('Returning cached location:', state.location);
      return state.location;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      console.log('Requesting user location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('Got raw coordinates:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });

          try {
            // Try both services in parallel
            const results = await Promise.allSettled([
              getLocationFromGoogleMaps(position),
              getLocationFromOpenCage(position)
            ]);

            console.log('Location service results:', results);

            // Use the first successful result
            const successfulResult = results.find(result => result.status === 'fulfilled');
            
            if (successfulResult && successfulResult.status === 'fulfilled') {
              const location = successfulResult.value;
              console.log('Using successful location result:', location);
              state.setLocation(location);
              resolve(location);
            } else {
              // If both failed, fall back to raw coordinates
              console.log('Both location services failed, using raw coordinates');
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              state.setLocation(location);
              resolve(location);
            }
          } catch (error) {
            console.error('Error getting location:', error);
            // Even if geocoding fails, return the raw coordinates
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            state.setLocation(location);
            resolve(location);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
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
