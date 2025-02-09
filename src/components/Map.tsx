import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { Camera, Fish } from "lucide-react";
import { pipeline } from "@huggingface/transformers";
import { useToast } from "./ui/use-toast";

interface Location {
  id: string;
  name: string;
  position: google.maps.LatLng;
  photo?: string;
  rating?: number;
}

interface ClassificationResult {
  label: string;
  score: number;
}

export const Map = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [prediction, setPrediction] = useState<string>("");
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
          const newLocations = results.map(place => ({
            id: place.place_id!,
            name: place.name!,
            position: place.geometry!.location!,
            photo: place.photos?.[0].getUrl(),
            rating: place.rating
          }));

          setLocations(newLocations);

          // Clear existing markers
          locations.forEach(location => {
            const markers = document.querySelectorAll('.map-marker');
            markers.forEach(marker => marker.remove());
          });

          // Add new markers
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
            });
          });
        }
      });
    }
  };

  const startCamera = async () => {
    console.log("Starting camera...");
    try {
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      videoRef.current.srcObject = stream;
      
      setShowCamera(true);

      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject("Video element not found");
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            console.log("Video playback started successfully");
            toast({
              title: "Camera started",
              description: "Your camera is now active",
            });
            resolve(true);
          } catch (err) {
            console.error("Error playing video:", err);
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: "Could not start video playback. Please try again.",
            });
            reject(err);
          }
        };
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
      });
      setShowCamera(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      if (videoRef.current.readyState !== 4) {
        throw new Error("Video is not ready yet");
      }

      console.log("Capturing image...");
      ctx.drawImage(videoRef.current, 0, 0);
      
      try {
        toast({
          title: "Processing",
          description: "Analyzing image...",
        });

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        const classifier = await pipeline(
          "image-classification",
          "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k"
        );

        const result = await classifier(imageDataUrl);
        if (Array.isArray(result)) {
          const predictions = result as ClassificationResult[];
          if (predictions.length > 0) {
            setPrediction(predictions[0].score > 0.5 ? predictions[0].label : "No fish detected");
            toast({
              title: "Analysis complete",
              description: `Detected: ${predictions[0].label}`,
            });
          }
        }
      } catch (error) {
        console.error("Error analyzing image:", error);
        toast({
          variant: "destructive",
          title: "Analysis Error",
          description: "Failed to analyze the image. Please try again.",
        });
      }
      
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    } catch (error) {
      console.error("Error capturing image:", error);
      toast({
        variant: "destructive",
        title: "Capture Error",
        description: "Failed to capture the image. Please try again.",
      });
    }
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyC1Qa6zQG4vHuX3nzneAFGmrFGcj2Tu5TE",
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
        searchNearbyLocations(mapInstance);

        mapInstance.addListener("idle", () => {
          searchNearbyLocations(mapInstance);
        });
      }
    });
  }, []);

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      <button
        onClick={startCamera}
        className="absolute top-20 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
      >
        <Camera className="w-6 h-6 text-gray-700" />
      </button>

      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="relative w-full h-[480px] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                  }
                  setShowCamera(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={captureAndAnalyze}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Capture & Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {prediction && (
        <Card className="absolute top-20 left-8 p-4 w-80 bg-white/90 backdrop-blur-sm">
          <p className="font-semibold">Detected Fish:</p>
          <p className="text-gray-700">{prediction}</p>
        </Card>
      )}
      
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
