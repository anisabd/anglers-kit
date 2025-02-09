
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FishAnalysis } from "@/types/map";

interface FishCameraProps {
  onAnalysisComplete: (analysis: FishAnalysis) => void;
}

export const FishCamera = ({ onAnalysisComplete }: FishCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
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

      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('key_value')
        .eq('key_name', 'VITE_GOOGLE_CLOUD_API_KEY')
        .single();

      if (secretError || !secretData?.key_value) {
        throw new Error("Could not retrieve Google Cloud API key");
      }

      const apiKey = secretData.key_value;
      const base64Image = imageDataUrl.split(',')[1];
      
      if (!base64Image) {
        throw new Error("Failed to process image data");
      }

      const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
      const visionResponse = await fetch(visionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'LABEL_DETECTION', maxResults: 10 }
            ]
          }]
        })
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        throw new Error(`Google Vision API error (${visionResponse.status}): ${errorText}`);
      }

      const visionData = await visionResponse.json();
      const detectedObjects = visionData.responses?.[0]?.localizedObjectAnnotations;
      const labels = visionData.responses?.[0]?.labelAnnotations;

      if (!detectedObjects || detectedObjects.length === 0) {
        throw new Error("No objects detected in the image");
      }

      const fishObjects = detectedObjects.filter((obj: any) => 
        obj.name.toLowerCase().includes('fish') || 
        obj.name.toLowerCase().includes('marine') ||
        obj.name.toLowerCase().includes('aquatic')
      );

      if (fishObjects.length === 0) {
        throw new Error("No fish detected in the image");
      }

      const highestConfidenceFish = fishObjects[0];
      const relevantLabels = labels
        ?.filter((label: any) => 
          label.description.toLowerCase().includes('fish') ||
          label.description.toLowerCase().includes('marine') ||
          label.description.toLowerCase().includes('aquatic')
        )
        .map((label: any) => label.description)
        .join(', ');

      const { data: openAISecretData } = await supabase
        .from('secrets')
        .select('key_value')
        .eq('key_name', 'VITE_OPENAI_API_KEY')
        .single();

      if (!openAISecretData?.key_value) {
        throw new Error("OpenAI API key is not configured");
      }

      const prompt = `Based on the detected fish (${highestConfidenceFish.name}) and these visual labels: ${relevantLabels}, 
      please:
      1. Identify the most likely species of fish
      2. Provide a brief description of this species (2-3 sentences about habitat and behavior)
      3. Assess its conservation status (e.g., Least Concern, Near Threatened, Vulnerable, Endangered, etc.)
      Return the response as a JSON object with fields: species, description, conservationStatus`;

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAISecretData.key_value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: "You are a marine biology and conservation expert. Provide accurate species identification and conservation information in JSON format."
          }, {
            role: "user",
            content: prompt
          }]
        })
      });

      if (!openAIResponse.ok) {
        throw new Error("Failed to analyze fish species");
      }

      const openAIData = await openAIResponse.json();
      const analysisResult = JSON.parse(openAIData.choices[0].message.content);
      
      const analysis: FishAnalysis = {
        species: analysisResult.species,
        confidence: highestConfidenceFish.score,
        description: analysisResult.description,
        conservationStatus: analysisResult.conservationStatus
      };

      onAnalysisComplete(analysis);

      toast({
        title: "Analysis Complete",
        description: `Identified ${analysis.species} with ${Math.round(highestConfidenceFish.score * 100)}% confidence`,
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

  return (
    <>
      <button
        onClick={startCamera}
        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50"
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
    </>
  );
};
