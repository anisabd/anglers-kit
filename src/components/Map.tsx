import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { CloudSun, Fish, X } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Location, FishAnalysis, WeatherAnalysis } from "@/types/map";
import { useLocation } from "@/hooks/useLocation";
import { analyzeWeather } from "@/services/weatherService";
import { analyzeFishingSpot } from "@/services/fishingSpotService";
import { FishCamera } from "./FishCamera";
import { LocationCard } from "./LocationCard";
import { FishingRegulations } from "./FishingRegulations";
import { useLocationStore } from "@/hooks/useGlobalLocation";
import { fetchMPAsInViewport, MarineProtectedArea } from "@/services/mpaService";

export const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [fishAnalysis, setFishAnalysis] = useState<FishAnalysis | null>(null);
  const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherAnalysis | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showWeatherAnalysis, setShowWeatherAnalysis] = useState(true);
  const [locationAnalysis, setLocationAnalysis] = useState<Record<string, Location['fishSpecies']>>({});
  const [mpas, setMpas] = useState<MarineProtectedArea[]>([]);
  const [mpaOverlays, setMpaOverlays] = useState<google.maps.Polygon[]>([]);
  const { toast } = useToast();
  const { getLocation } = useLocationStore();

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

  const getProtectionLevelColor = (level?: string) => {
    switch (level) {
      case 'restricted': return '#FF0000'; // Red for restricted areas
      case 'safe': return '#00FF00'; // Green for safe areas
      case 'endangered': return '#FFA500'; // Orange for endangered areas
      default: return '#808080'; // Gray for unknown
    }
  };

  const getProtectionLevelDescription = (level?: string) => {
    switch (level) {
      case 'restricted': return 'Restricted Area - Limited or No Access';
      case 'safe': return 'Safe Area - Moderate Protection';
      case 'endangered': return 'Endangered Area - Minimal Protection';
      default: return 'Protection Status Unknown';
    }
  };

  const clearMPAOverlays = () => {
    mpaOverlays.forEach(overlay => overlay.setMap(null));
    setMpaOverlays([]);
  };

  const displayMPAs = async (map: google.maps.Map) => {
    if (!map) return;
    
    try {
      clearMPAOverlays();
      const bounds = map.getBounds();
      if (!bounds) return;
      
      const mpas = await fetchMPAsInViewport(bounds);
      setMpas(mpas);

      const newOverlays = mpas.map(mpa => {
        if (!mpa.boundaries) return null;

        const paths = mpa.boundaries.coordinates[0].map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));

        const polygon = new google.maps.Polygon({
          paths,
          strokeColor: getProtectionLevelColor(mpa.protection_level),
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: getProtectionLevelColor(mpa.protection_level),
          fillOpacity: 0.35,
          map
        });

        polygon.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">${mpa.name}</h3>
                <p class="text-sm">${mpa.designation || 'No designation'}</p>
                <p class="text-sm">${getProtectionLevelDescription(mpa.protection_level)}</p>
                <p class="text-sm">Area: ${mpa.area_km2?.toFixed(2) || 'Unknown'} km²</p>
              </div>
            `
          });

          infoWindow.setPosition(bounds.getCenter());
          infoWindow.open(map);
        });

        return polygon;
      }).filter(Boolean) as google.maps.Polygon[];

      setMpaOverlays(newOverlays);
    } catch (error) {
      console.error('Error displaying MPAs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load marine protected areas.",
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
          
          // Load MPAs when the map is ready
          await displayMPAs(mapInstance);
          
          // Add listener for map idle event to update MPAs
          mapInstance.addListener('idle', () => {
            displayMPAs(mapInstance);
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
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0" />
      
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <FishCamera onAnalysisComplete={setFishAnalysis} />

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
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
          disabled={isLoadingWeather}
        >
          <CloudSun className="w-6 h-6 text-gray-700" />
        </button>

        <FishingRegulations />
      </div>

      {fishAnalysis && (
        <Card className="absolute top-4 left-4 p-4 w-80 bg-white/90 backdrop-blur-sm z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">{fishAnalysis.species}</h3>
              </div>
              <button 
                onClick={() => setFishAnalysis(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Confidence: {Math.round(fishAnalysis.confidence * 100)}%
            </p>
            <p className="text-sm text-gray-700">{fishAnalysis.description}</p>
          </div>
        </Card>
      )}
      
      {weatherAnalysis && showWeatherAnalysis && (
        <Card className="absolute top-4 left-4 p-4 w-80 bg-white/90 backdrop-blur-sm z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Weather Conditions</h3>
              </div>
              <button 
                onClick={() => setShowWeatherAnalysis(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
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
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default MapComponent;
