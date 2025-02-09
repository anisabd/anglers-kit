
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
    console.error('Error retrieving OpenWeatherMap API key:', weatherKeyError);
    throw new Error("Could not retrieve OpenWeatherMap API key");
  }

  if (!weatherKeyData || !weatherKeyData.key_value) {
    console.error('No OpenWeatherMap API key found in secrets');
    throw new Error("OpenWeatherMap API key not found in secrets");
  }

  const weatherApiKey = weatherKeyData.key_value;
  console.log('Retrieved weather API key:', weatherApiKey.substring(0, 4) + '...');

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.lat()}&lon=${position.lng()}&units=metric&appid=${weatherApiKey}`;
  console.log('Making weather API request to:', url.replace(weatherApiKey, 'HIDDEN'));

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

  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('key_value')
    .eq('key_name', 'OPENAI_API_KEY')
    .single();

  if (secretError) {
    console.error('Error retrieving OpenAI API key:', secretError);
    throw new Error("Could not retrieve OpenAI API key");
  }

  if (!secretData || !secretData.key_value) {
    console.error('No OpenAI API key found in secrets');
    throw new Error("OpenAI API key not found in secrets");
  }

  const openAIKey = secretData.key_value;
  
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
