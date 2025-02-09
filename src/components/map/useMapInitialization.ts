
import { useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Location } from "@/types/map";
import { useLocation } from "@/hooks/useLocation";
import { useToast } from "../ui/use-toast";
import { analyzeWeather } from "@/services/weatherService";

export const useMapInitialization = (
  mapRef: React.RefObject<HTMLDivElement>,
  onLocationsUpdate: (locations: Location[]) => void
) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherAnalysis, setWeatherAnalysis] = useState(null);
  const { getUserLocation } = useLocation();
  const { toast } = useToast();

  const searchNearbyLocations = (map: google.maps.Map) => {
    const service = new google.maps.places.PlacesService(map);
    const center = map.getCenter();
    
    if (center) {
      service.nearbySearch({
        location: { lat: center.lat(), lng: center.lng() },
        radius: 5000,
        keyword: "fishing spot"
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          setMarkers([]);

          const newLocations = results.map(place => ({
            id: place.place_id!,
            name: place.name!,
            position: place.geometry!.location!,
            photo: place.photos?.[0].getUrl(),
            rating: place.rating
          }));
          
          // Create and store new markers
          const newMarkers = newLocations.map(location => {
            const marker = new google.maps.Marker({
              position: location.position,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#0ca5e9",
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: "#ffffff"
              }
            });

            marker.addListener("click", () => {
              onLocationsUpdate([location]);
            });

            return marker;
          });

          setMarkers(newMarkers);
          onLocationsUpdate(newLocations);
        }
      });
    }
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyC1Qa6zQG4vHuX3nzneAFGmrFGcj2Tu5TE",
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(async () => {
      if (mapRef.current) {
        try {
          const userLocation = await getUserLocation();
          const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
          
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: userLatLng,
            zoom: 12,
            styles: [
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#e0f2fe" }]
              },
              {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#f4f7f4" }]
              }
            ]
          });

          setMap(mapInstance);
          searchNearbyLocations(mapInstance);
          
          setIsLoadingWeather(true);
          try {
            const weatherData = await analyzeWeather(userLatLng);
            setWeatherAnalysis(weatherData);
            toast({
              title: "Weather Analysis Complete",
              description: "Fishing conditions have been analyzed!",
            });
          } catch (error) {
            console.error("Error analyzing weather:", error);
            toast({
              variant: "destructive",
              title: "Weather Analysis Error",
              description: "Could not analyze weather conditions.",
            });
          } finally {
            setIsLoadingWeather(false);
          }

          mapInstance.addListener("idle", () => {
            searchNearbyLocations(mapInstance);
          });
        } catch (error) {
          console.error("Failed to get user location:", error);
          // Fallback to default location (New York)
          const defaultLocation = new google.maps.LatLng(40.7128, -74.0060);
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 12,
            styles: [
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#e0f2fe" }]
              },
              {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#f4f7f4" }]
              }
            ]
          });

          setMap(mapInstance);
          searchNearbyLocations(mapInstance);
        }
      }
    });

    // Cleanup function to remove markers when component unmounts
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, []);

  return { map, isLoadingWeather, weatherAnalysis, setWeatherAnalysis, searchNearbyLocations };
};
