
import { WeatherAnalysis } from "@/types/map";
import { supabase } from "@/integrations/supabase/client";

export const analyzeWeather = async (position: google.maps.LatLng): Promise<WeatherAnalysis> => {
  // First, get the OpenWeatherMap API key from Supabase secrets
  const { data: weatherKeyData, error: weatherKeyError } = await supabase
    .from('secrets')
    .select('key_value')
    .eq('key_name', 'OPENWEATHERMAP_API_KEY')
    .single();

  if (weatherKeyError) {
    throw new Error("Could not retrieve OpenWeatherMap API key");
  }

  const weatherApiKey = weatherKeyData.key_value;

  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${position.lat()}&lon=${position.lng()}&units=metric&appid=${weatherApiKey}`
  );
  
  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${await weatherResponse.text()}`);
  }
  
  const weatherData = await weatherResponse.json();

  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('key_value')
    .eq('key_name', 'OPENAI_API_KEY')
    .single();

  if (secretError) {
    throw new Error("Could not retrieve OpenAI API key");
  }

  const openAIKey = secretData?.key_value;
  
  const prompt = `Given the following weather conditions:
    - Temperature: ${weatherData.main.temp}°C
    - Weather: ${weatherData.weather[0].main}
    - Wind Speed: ${weatherData.wind.speed} m/s
    - Humidity: ${weatherData.main.humidity}%
    
    Provide a brief 2-sentence analysis of the fishing conditions and the likelihood of catching fish.`;

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a fishing expert. Be concise and specific about fishing conditions." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${await openAIResponse.text()}`);
  }

  const openAIData = await openAIResponse.json();
  
  return {
    weather: weatherData.weather[0].main,
    temperature: weatherData.main.temp,
    fishingConditions: openAIData.choices[0].message.content
  };
};
