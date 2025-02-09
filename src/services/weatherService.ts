
import { WeatherAnalysis } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

// For development, you can put your OpenAI and OpenWeatherMap API keys here
const OPENAI_API_KEY = "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";
const OPENWEATHER_API_KEY = "2fd1c1bfafc7ef6088bf1f18d6c41028";

export const analyzeWeather = async (position: google.maps.LatLng): Promise<WeatherAnalysis> => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.lat()}&lon=${position.lng()}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  console.log('Making weather API request to:', url.replace(OPENWEATHER_API_KEY, 'HIDDEN'));

  const weatherResponse = await fetch(url);
  
  if (!weatherResponse.ok) {
    const errorText = await weatherResponse.text();
    console.error('Weather API error:', {
      status: weatherResponse.status,
      statusText: weatherResponse.statusText,
      body: errorText
    });
    throw new Error(`Weather API error: ${errorText}`);
  }
  
  const weatherData = await weatherResponse.json();
  console.log('Weather data received:', weatherData);
  
  const prompt = `Given the following weather conditions:
    - Temperature: ${weatherData.main.temp}°C
    - Weather: ${weatherData.weather[0].main}
    - Wind Speed: ${weatherData.wind.speed} m/s
    - Humidity: ${weatherData.main.humidity}%
    
    Provide a brief 2-sentence analysis of the fishing conditions and the likelihood of catching fish.`;

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a fishing expert. Be concise and specific about fishing conditions." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    console.error('OpenAI API error:', {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      body: errorText
    });
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const openAIData = await openAIResponse.json();
  
  return {
    weather: weatherData.weather[0].main,
    temperature: weatherData.main.temp,
    fishingConditions: openAIData.choices[0].message.content
  };
};
