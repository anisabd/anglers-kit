
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "./ui/card";
import { Camera, Fish } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  id: string;
  name: string;
  position: google.maps.LatLng;
  photo?: string;
  rating?: number;
}

interface FishAnalysis {
  species: string;
  confidence: number;
  description: string;
}

export const Map = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [fishAnalysis, setFishAnalysis] = useState<FishAnalysis | null>(null);
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
      setShowCamera(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      if (videoRef.current.srcObject) {
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

      videoRef.current.srcObject = stream;

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
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
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

      ctx.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      toast({
        title: "Processing",
        description: "Analyzing image with Google Cloud Vision...",
      });

      console.log("Fetching Google Cloud API key from Supabase...");
      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('key_value')
        .eq('key_name', 'VITE_GOOGLE_CLOUD_API_KEY')
        .single();

      if (secretError) {
        console.error("Error fetching API key:", secretError);
        throw new Error("Could not retrieve Google Cloud API key");
      }

      if (!secretData || !secretData.key_value) {
        console.error("No API key found in secrets");
        throw new Error("Google Cloud API key not found in secrets");
      }

      const apiKey = secretData.key_value;
      console.log("API key retrieved successfully (first 4 chars):", apiKey.substring(0, 4));

      // Split the base64 data properly
      const base64Image = imageDataUrl.split(',')[1];
      if (!base64Image) {
        throw new Error("Failed to process image data");
      }

      console.log("Making request to Vision API...");
      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'OBJECT_LOCALIZATION',
              maxResults: 5
            }]
          }]
        })
      });

      console.log("Vision API response status:", visionResponse.status);
      
      if (!visionResponse.ok) {
        const errorData = await visionResponse.json();
        console.error('Vision API error details:', errorData);
        throw new Error(`Google Vision API error: ${errorData.error?.message || visionResponse.statusText}`);
      }

      const visionData = await visionResponse.json();
      console.log('Vision API response data:', visionData);

      if (!visionData.responses?.[0]?.localizedObjectAnnotations) {
        throw new Error('No object detection results found');
      }

      const detectedObjects = visionData.responses[0].localizedObjectAnnotations;
      console.log('Detected objects:', detectedObjects);

      const fishObjects = detectedObjects.filter((obj: any) => 
        obj.name.toLowerCase().includes('fish') || 
        obj.name.toLowerCase().includes('marine') ||
        obj.name.toLowerCase().includes('aquatic')
      );

      if (fishObjects.length === 0) {
        setFishAnalysis(null);
        toast({
          variant: "destructive",
          title: "No Fish Detected",
          description: "Could not detect any fish in the image. Please try again.",
        });
        return;
      }

      const highestConfidenceFish = fishObjects[0];

      const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openAIKey) {
        throw new Error("OpenAI API key is not configured");
      }

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [{
            role: "system",
            content: "You are a marine biology expert. Provide concise information about fish species."
          }, {
            role: "user",
            content: `Provide a brief description of the ${highestConfidenceFish.name}. Include its typical habitat and interesting facts in 2-3 sentences.`
          }]
        })
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || openAIResponse.statusText}`);
      }

      const openAIData = await openAIResponse.json();
      console.log('OpenAI API response:', openAIData);
      
      setFishAnalysis({
        species: highestConfidenceFish.name,
        confidence: highestConfidenceFish.score,
        description: openAIData.choices[0].message.content
      });

      toast({
        title: "Analysis Complete",
        description: `Detected ${highestConfidenceFish.name} with ${Math.round(highestConfidenceFish.score * 100)}% confidence`,
      });

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: error.message || "Failed to analyze the image. Please try again.",
      });

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
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
