
import { useRef, useState } from "react";
import { Location, FishAnalysis } from "@/types/map";
import { useLocation } from "@/hooks/useLocation";
import { analyzeFishingSpot } from "@/services/fishingSpotService";
import { useToast } from "./ui/use-toast";
import { analyzeWeather } from "@/services/weatherService";
import { LocationCard } from "./LocationCard";
import { WeatherAnalysisCard } from "./map/WeatherAnalysisCard";
import { FishAnalysisCard } from "./map/FishAnalysisCard";
import { MapControls } from "./map/MapControls";
import { useMapInitialization } from "./map/useMapInitialization";

export const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [fishAnalysis, setFishAnalysis] = useState<FishAnalysis | null>(null);
  const [showWeatherAnalysis, setShowWeatherAnalysis] = useState(true);
  const [locationAnalysis, setLocationAnalysis] = useState<Record<string, Location['fishSpecies']>>({});
  const { getUserLocation } = useLocation();
  const { toast } = useToast();

  const { 
    map, 
    isLoadingWeather, 
    weatherAnalysis, 
    setWeatherAnalysis,
    searchNearbyLocations 
  } = useMapInitialization(mapRef, (newLocations) => {
    setLocations(newLocations);
    
    // Remove existing markers
    const markers = document.querySelectorAll('.map-marker');
    markers.forEach(marker => marker.remove());

    // Add new markers
    if (map) {
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

  const handleWeatherClick = async () => {
    if (!map) return;
    try {
      const userLocation = await getUserLocation();
      const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
      map.panTo(userLatLng);
      const weatherData = await analyzeWeather(userLatLng);
      setWeatherAnalysis(weatherData);
      setShowWeatherAnalysis(true);
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
    }
  };

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      <MapControls
        onFishAnalysis={setFishAnalysis}
        onWeatherClick={handleWeatherClick}
        isLoadingWeather={isLoadingWeather}
      />

      {fishAnalysis && (
        <FishAnalysisCard
          fishAnalysis={fishAnalysis}
          onClose={() => setFishAnalysis(null)}
        />
      )}
      
      {weatherAnalysis && showWeatherAnalysis && (
        <WeatherAnalysisCard
          weatherAnalysis={weatherAnalysis}
          onClose={() => setShowWeatherAnalysis(false)}
        />
      )}
      
      {selectedLocation && (
        <LocationCard 
          location={selectedLocation}
          fishSpecies={locationAnalysis[selectedLocation.id]}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default MapComponent;
