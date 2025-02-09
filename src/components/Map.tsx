
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { MapPin, Fish } from "lucide-react";

interface Location {
  id: string;
  name: string;
  position: google.maps.LatLng;
  photo?: string;
  rating?: number;
}

export const Map = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: "YOUR_GOOGLE_MAPS_API_KEY",
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 },
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

        const service = new google.maps.places.PlacesService(mapInstance);
        
        service.nearbySearch({
          location: { lat: 40.7128, lng: -74.0060 },
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

            newLocations.forEach(location => {
              const marker = new google.maps.Marker({
                position: location.position,
                map: mapInstance,
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
              });
            });
          }
        });
      }
    });
  }, []);

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {selectedLocation && (
        <Card className="absolute bottom-8 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-water-100">
              <Fish className="w-5 h-5 text-water-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{selectedLocation.name}</h3>
              {selectedLocation.rating && (
                <p className="text-sm text-gray-600">Rating: {selectedLocation.rating} ★</p>
              )}
            </div>
          </div>
          {selectedLocation.photo && (
            <img
              src={selectedLocation.photo}
              alt={selectedLocation.name}
              className="mt-3 w-full h-40 object-cover rounded-lg"
            />
          )}
        </Card>
      )}
    </div>
  );
};
