
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { CloudSun, Fish } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Location, FishAnalysis, WeatherAnalysis } from "@/types/map";
import { useLocation } from "@/hooks/useLocation";
import { analyzeWeather } from "@/services/weatherService";
import { analyzeFishingSpot } from "@/services/fishingSpotService";
import { FishCamera } from "./FishCamera";
import { LocationCard } from "./LocationCard";

export const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [fishAnalysis, setFishAnalysis] = useState<FishAnalysis | null>(null);
  const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherAnalysis | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [locationAnalysis, setLocationAnalysis] = useState<Record<string, Location['fishSpecies']>>({});
  const { toast } = useToast();
  const { getUserLocation } = useLocation();

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
          const newLocations = results.map(place => ({
            id: place.place_id!,
            name: place.name!,
            position: place.geometry!.location!,
            photo: place.photos?.[0].getUrl(),
            rating: place.rating
          }));

          setLocations(newLocations);

          const markers = document.querySelectorAll('.map-marker');
          markers.forEach(marker => marker.remove());

          newLocations.forEach(location => {
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
              setSelectedLocation(location);
              if (!locationAnalysis[location.id]) {
                analyzeFishingSpot(location)
                  .then(fishSpecies => {
                    setLocationAnalysis(prev => ({
                      ...prev,
                      [location.id]: fishSpecies
                    }));
                  })
                  .catch(error => {
                    console.error('Error analyzing fishing spot:', error);
                    toast({
                      variant: "destructive",
                      title: "Analysis Error",
                      description: "Could not analyze fishing spot.",
                    });
                  });
              }
            });
          });
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
  }, []);

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      <div className="absolute top-20 right-4 flex flex-col gap-2">
        <FishCamera onAnalysisComplete={setFishAnalysis} />

        <button
          onClick={async () => {
            if (!map) return;
            try {
              const userLocation = await getUserLocation();
              const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
              map.panTo(userLatLng);
              setIsLoadingWeather(true);
              const weatherData = await analyzeWeather(userLatLng);
              setWeatherAnalysis(weatherData);
              toast({
                title: "Weather Analysis Complete",
                description: "Fishing conditions have been analyzed!",
              });
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Location Error",
                description: "Could not access your location.",
              });
            } finally {
              setIsLoadingWeather(false);
            }
          }}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
          disabled={isLoadingWeather}
        >
          <CloudSun className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {fishAnalysis && (
        <Card className="absolute top-20 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg">{fishAnalysis.species}</h3>
            </div>
            <p className="text-sm text-gray-600">
              Confidence: {Math.round(fishAnalysis.confidence * 100)}%
            </p>
            <p className="text-sm text-gray-700">{fishAnalysis.description}</p>
          </div>
        </Card>
      )}
      
      {weatherAnalysis && (
        <Card className="absolute top-20 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg">Weather Conditions</h3>
            </div>
            <p className="text-sm text-gray-600">
              {weatherAnalysis.weather} • {Math.round(weatherAnalysis.temperature)}°C
            </p>
            <p className="text-sm text-gray-700">{weatherAnalysis.fishingConditions}</p>
          </div>
        </Card>
      )}
      
      {selectedLocation && (
        <LocationCard 
          location={selectedLocation}
          fishSpecies={locationAnalysis[selectedLocation.id]}
        />
      )}
    </div>
  );
};

export default MapComponent;
