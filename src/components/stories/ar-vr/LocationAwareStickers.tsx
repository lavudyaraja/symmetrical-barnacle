import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MapPin, 
  Sun, 
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  weather: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
    temperature: number;
    humidity: number;
  };
  time: string;
  timezone: string;
}

interface DynamicSticker {
  id: string;
  type: 'weather' | 'location' | 'event' | 'time';
  name: string;
  icon: React.ReactNode;
  description: string;
  animation: string;
  position: { x: number; y: number };
}

interface LocationAwareStickersProps {
  onStickerAdd: (sticker: DynamicSticker) => void;
  className?: string;
}

export function LocationAwareStickers({
  onStickerAdd,
  className = ''
}: LocationAwareStickersProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stickers, setStickers] = useState<DynamicSticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<DynamicSticker | null>(null);

  // Detect current location and weather
  const detectLocation = async () => {
    setIsDetecting(true);
    
    try {
      // Simulate geolocation and weather API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock location data
      const mockLocation: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'United States',
        weather: {
          condition: 'sunny',
          temperature: 72,
          humidity: 65
        },
        time: '14:30',
        timezone: 'EST'
      };

      setLocation(mockLocation);
      generateDynamicStickers(mockLocation);
    } catch (error) {
      console.error('Error detecting location:', error);
      toast.error('Failed to detect location');
    } finally {
      setIsDetecting(false);
    }
  };

  // Generate dynamic stickers based on location data
  const generateDynamicStickers = (locationData: LocationData) => {
    const newStickers: DynamicSticker[] = [];
    
    // Weather-based stickers
    const weatherStickers = {
      sunny: {
        icon: <Sun className="w-6 h-6 text-yellow-500" />,
        name: 'Sunny Day',
        description: 'Bright sunshine sticker',
        animation: 'animate-pulse'
      },
      cloudy: {
        icon: <Cloud className="w-6 h-6 text-gray-500" />,
        name: 'Cloudy Skies',
        description: 'Gentle cloud sticker',
        animation: 'animate-bounce'
      },
      rainy: {
        icon: <CloudRain className="w-6 h-6 text-blue-500" />,
        name: 'Rain Drops',
        description: 'Refreshing rain sticker',
        animation: 'animate-ping'
      },
      snowy: {
        icon: <CloudSnow className="w-6 h-6 text-blue-200" />,
        name: 'Snow Flakes',
        description: 'Winter wonderland sticker',
        animation: 'animate-pulse'
      },
      windy: {
        icon: <Wind className="w-6 h-6 text-gray-400" />,
        name: 'Wind Gust',
        description: 'Breezy wind sticker',
        animation: 'animate-bounce'
      }
    };

    const weatherSticker = weatherStickers[locationData.weather.condition];
    
    newStickers.push({
      id: `weather-${Date.now()}`,
      type: 'weather',
      name: weatherSticker.name,
      icon: weatherSticker.icon,
      description: weatherSticker.description,
      animation: weatherSticker.animation,
      position: { x: 20, y: 20 }
    });

    // Location-based stickers
    newStickers.push({
      id: `location-${Date.now()}`,
      type: 'location',
      name: locationData.city,
      icon: <MapPin className="w-6 h-6 text-red-500" />,
      description: `Sticker for ${locationData.city}`,
      animation: 'animate-bounce',
      position: { x: 70, y: 70 }
    });

    // Time-based stickers
    const hour = parseInt(locationData.time.split(':')[0]);
    let timeSticker;
    
    if (hour >= 5 && hour < 12) {
      timeSticker = {
        icon: <Sun className="w-6 h-6 text-orange-400" />,
        name: 'Morning Vibes',
        description: 'Good morning sticker',
        animation: 'animate-pulse'
      };
    } else if (hour >= 12 && hour < 18) {
      timeSticker = {
        icon: <Sun className="w-6 h-6 text-yellow-500" />,
        name: 'Afternoon Sun',
        description: 'Midday energy sticker',
        animation: 'animate-bounce'
      };
    } else {
      timeSticker = {
        icon: <Sparkles className="w-6 h-6 text-purple-400" />,
        name: 'Evening Glow',
        description: 'Night time sticker',
        animation: 'animate-pulse'
      };
    }

    newStickers.push({
      id: `time-${Date.now()}`,
      type: 'time',
      name: timeSticker.name,
      icon: timeSticker.icon,
      description: timeSticker.description,
      animation: timeSticker.animation,
      position: { x: 50, y: 30 }
    });

    setStickers(newStickers);
  };

  // Handle sticker selection
  const handleStickerSelect = (sticker: DynamicSticker) => {
    setSelectedSticker(sticker);
    onStickerAdd(sticker);
    toast.success(`${sticker.name} sticker added to your story!`);
  };

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'snowy': return <CloudSnow className="w-4 h-4 text-blue-200" />;
      case 'windy': return <Wind className="w-4 h-4 text-gray-400" />;
      default: return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            Location-Aware Stickers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dynamic stickers that change based on your location and environment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Detection */}
          <div className="space-y-3">
            <Button
              onClick={detectLocation}
              disabled={isDetecting}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Detecting Location & Weather...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Detect My Location
                </>
              )}
            </Button>

            {location && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{location.city}, {location.country}</h3>
                      <p className="text-sm text-muted-foreground">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {getWeatherIcon(location.weather.condition)}
                        <span className="font-bold">{location.weather.temperature}°F</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {location.weather.condition.charAt(0).toUpperCase() + location.weather.condition.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs">
                      <Thermometer className="w-3 h-3" />
                      <span>Humidity: {location.weather.humidity}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {location.time} {location.timezone}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dynamic Stickers */}
          {stickers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Dynamic Stickers
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stickers.map((sticker) => (
                  <Card 
                    key={sticker.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSticker?.id === sticker.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : ''
                    }`}
                    onClick={() => handleStickerSelect(sticker)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`${sticker.animation} mb-2 flex justify-center`}>
                        {sticker.icon}
                      </div>
                      <h4 className="font-medium text-sm">{sticker.name}</h4>
                      <Badge variant="outline" className="mt-1 text-xs capitalize">
                        {sticker.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedSticker && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selected Sticker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className={selectedSticker.animation}>
                    {selectedSticker.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedSticker.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSticker.description}
                    </p>
                  </div>
                </div>
                <Button className="w-full mt-3">Add to Story</Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}