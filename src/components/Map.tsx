import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { CloudSun, Fish, X, Map as MapIcon } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Location, FishAnalysis, WeatherAnalysis } from "@/types/map";
import { useLocation } from "@/hooks/useLocation";
import { analyzeWeather } from "@/services/weatherService";
import { analyzeFishingSpot } from "@/services/fishingSpotService";
import { FishCamera } from "./FishCamera";
import { LocationCard } from "./LocationCard";
import { FishingRegulations } from "./FishingRegulations";
import { useLocationStore } from "@/hooks/useGlobalLocation";
import { useTheme } from "next-themes";

export const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [fishAnalysis, setFishAnalysis] = useState<FishAnalysis | null>(null);
  const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherAnalysis | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showWeatherAnalysis, setShowWeatherAnalysis] = useState(true);
  const [showMapLabels, setShowMapLabels] = useState(true);
  const [locationAnalysis, setLocationAnalysis] = useState<Record<string, Location['fishSpecies']>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { getLocation } = useLocationStore();
  const { theme } = useTheme();

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

            marker.addListener("click", async () => {
              setSelectedLocation(location);
              setIsAnalyzing(prev => ({
                ...prev,
                [location.id]: true
              }));

              try {
                const fishSpecies = await analyzeFishingSpot(location);
                console.log('Received fish species:', fishSpecies);
                setLocationAnalysis(prev => ({
                  ...prev,
                  [location.id]: fishSpecies
                }));
              } catch (error) {
                console.error('Error analyzing fishing spot:', error);
                toast({
                  variant: "destructive",
                  title: "Analysis Error",
                  description: "Could not analyze fishing spot.",
                });
              } finally {
                setIsAnalyzing(prev => ({
                  ...prev,
                  [location.id]: false
                }));
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
          const userLocation = await getLocation();
          const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
          
          const darkModeStyles = [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }]
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#242f3e" }]
            }
          ];

          const lightModeStyles = [
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
          ];

          const noLabelsStyles = [
            {
              featureType: "all",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ];
          
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: userLatLng,
            zoom: 12,
            styles: [
              ...(theme === 'dark' ? darkModeStyles : lightModeStyles),
              ...(showMapLabels ? [] : noLabelsStyles)
            ]
          });

          setMap(mapInstance);
          searchNearbyLocations(mapInstance);
          
          mapInstance.addListener('idle', () => {
            searchNearbyLocations(mapInstance);
          });

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
        } catch (error) {
          console.error("Failed to get user location:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not access your location. Please enable location access and try again.",
          });
        }
      }
    });
  }, [theme, showMapLabels]);

  return (
    <div className="relative h-[calc(100vh-68px)] w-full">
      <div ref={mapRef} className="absolute inset-0" />
      
      <div className="absolute top-24 right-4 flex flex-col gap-2 z-10">
        <div className="dark:text-gray-300">
          <FishCamera onAnalysisComplete={setFishAnalysis} />
        </div>

        <button
          onClick={async () => {
            if (!map) return;
            try {
              const userLocation = await getLocation();
              const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
              map.panTo(userLatLng);
              setIsLoadingWeather(true);
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
            } finally {
              setIsLoadingWeather(false);
            }
          }}
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={isLoadingWeather}
        >
          <CloudSun className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={() => setShowMapLabels(!showMapLabels)}
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <MapIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>

        <FishingRegulations />
      </div>

      {fishAnalysis && (
        <Card className="absolute top-4 left-4 p-4 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{fishAnalysis.species}</h3>
              </div>
              <button 
                onClick={() => setFishAnalysis(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Confidence: {Math.round(fishAnalysis.confidence * 100)}%
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200">{fishAnalysis.description}</p>
          </div>
        </Card>
      )}
      
      {weatherAnalysis && showWeatherAnalysis && (
        <Card className="absolute top-4 left-4 p-4 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Weather Conditions</h3>
              </div>
              <button 
                onClick={() => setShowWeatherAnalysis(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {weatherAnalysis.weather} • {Math.round(weatherAnalysis.temperature)}°C
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200">{weatherAnalysis.fishingConditions}</p>
          </div>
        </Card>
      )}
      
      {selectedLocation && (
        <LocationCard 
          location={selectedLocation}
          fishSpecies={locationAnalysis[selectedLocation.id]}
          onClose={() => setSelectedLocation(null)}
          isLoading={isAnalyzing[selectedLocation.id]}
        />
      )}
    </div>
  );
};

export default MapComponent;
