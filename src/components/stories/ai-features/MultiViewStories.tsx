import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout,
  Camera,
  RefreshCw,
  Sparkles,
  Check,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface MultiViewMedia {
  id: string;
  file?: File;
  url?: string;
  type: 'image' | 'video';
  position: 'front' | 'back' | 'left' | 'right';
  timestamp: number;
}

interface MultiViewStoriesProps {
  onStoriesCreated: (stories: MultiViewMedia[]) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export function MultiViewStories({
  onStoriesCreated,
  maxDuration = 15,
  className = ''
}: MultiViewStoriesProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedMedia, setRecordedMedia] = useState<MultiViewMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const mediaRecorders = useRef<Record<string, MediaRecorder | null>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Enumerate available cameras
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Auto-select first two cameras if available
      if (videoDevices.length >= 2) {
        setSelectedCameras([videoDevices[0].deviceId, videoDevices[1].deviceId]);
      } else if (videoDevices.length === 1) {
        setSelectedCameras([videoDevices[0].deviceId]);
      }
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      toast.error('Unable to access cameras. Please check permissions.');
    }
  };

  // Initialize camera streams
  const initializeCameras = async () => {
    try {
      // Stop any existing streams
      Object.values(videoRefs.current).forEach(video => {
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      });

      // Initialize selected cameras
      for (const deviceId of selectedCameras) {
        const constraints = {
          video: { deviceId: { exact: deviceId } },
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRefs.current[deviceId]) {
          videoRefs.current[deviceId]!.srcObject = stream;
        }
      }
    } catch (error) {
      console.error('Error initializing cameras:', error);
      toast.error('Failed to initialize cameras');
    }
  };

  // Start multi-camera recording
  const startRecording = async () => {
    if (selectedCameras.length === 0) {
      toast.error('Please select at least one camera');
      return;
    }

    try {
      // Initialize cameras first
      await initializeCameras();
      
      // Start recording on all selected cameras
      for (const deviceId of selectedCameras) {
        const video = videoRefs.current[deviceId];
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream;
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
          });
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setRecordedMedia(prev => [
              ...prev,
              {
                id: `media-${deviceId}-${Date.now()}`,
                file: new File([blob], `multi-view-${deviceId}.webm`, { type: 'video/webm' }),
                type: 'video',
                position: deviceId === selectedCameras[0] ? 'front' : 'back',
                timestamp: Date.now()
              }
            ]);
          };
          
          mediaRecorders.current[deviceId] = mediaRecorder;
          mediaRecorder.start();
        }
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop all media recorders
    Object.values(mediaRecorders.current).forEach(recorder => {
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
    });
    
    // Stop all camera streams
    Object.values(videoRefs.current).forEach(video => {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, position: 'front' | 'back' | 'left' | 'right') => {
    const file = event.target.files?.[0];
    if (file) {
      setRecordedMedia(prev => [
        ...prev,
        {
          id: `upload-${position}-${Date.now()}`,
          file,
          url: URL.createObjectURL(file),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          position,
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Create stories from recorded media
  const createStories = async () => {
    if (recordedMedia.length === 0) {
      toast.error('No media recorded or uploaded');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Simulate uploading process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onStoriesCreated(recordedMedia);
      toast.success('Multi-view stories created successfully!');
    } catch (error) {
      console.error('Error creating stories:', error);
      toast.error('Failed to create stories');
    } finally {
      setIsUploading(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  React.useEffect(() => {
    enumerateCameras();
    
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop all streams
      Object.values(videoRefs.current).forEach(video => {
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      // Revoke object URLs
      recordedMedia.forEach(media => {
        if (media.url) {
          URL.revokeObjectURL(media.url);
        }
      });
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layout className="w-5 h-5" />
            Multi-View Stories
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Record from multiple cameras simultaneously for unique perspectives
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Selection */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Select Cameras
            </h3>
            
            {cameras.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cameras.map((camera) => (
                  <div 
                    key={camera.deviceId}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedCameras.includes(camera.deviceId)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                    onClick={() => {
                      if (selectedCameras.includes(camera.deviceId)) {
                        setSelectedCameras(prev => prev.filter(id => id !== camera.deviceId));
                      } else {
                        setSelectedCameras(prev => [...prev, camera.deviceId]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{camera.label || `Camera ${cameras.indexOf(camera) + 1}`}</span>
                      {selectedCameras.includes(camera.deviceId) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {camera.deviceId === selectedCameras[0] ? 'Primary view' : 'Secondary view'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No cameras detected. Please connect cameras and refresh.
                </p>
                <Button 
                  variant="outline" 
                  onClick={enumerateCameras}
                  className="mt-2"
                >
                  Refresh Cameras
                </Button>
              </div>
            )}
          </div>

          {/* Camera Previews */}
          {selectedCameras.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Camera Previews</h3>
              
              <div className={`grid gap-4 ${
                selectedCameras.length === 1 ? 'grid-cols-1' : 
                selectedCameras.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                'grid-cols-2'
              }`}>
                {selectedCameras.map((deviceId, index) => (
                  <div key={deviceId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {index === 0 ? 'Primary Camera' : `Camera ${index + 1}`}
                      </span>
                      <Badge variant="outline">
                        {index === 0 ? 'Front View' : 'Back View'}
                      </Badge>
                    </div>
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={el => videoRefs.current[deviceId] = el}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {isRecording && (
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-xs text-white font-medium">
                            REC
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={selectedCameras.length === 0 || isUploading}
                className={`flex-1 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full mr-2" />
                    Stop Recording ({formatTime(recordingTime)})
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={createStories}
                disabled={recordedMedia.length === 0 || isRecording || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Stories
                  </>
                )}
              </Button>
            </div>
            
            {isRecording && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Upload Alternative */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground px-2">OR UPLOAD</span>
              <div className="flex-1 border-t" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Front View</label>
                <div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e, 'front')}
                    className="hidden"
                    id="front-upload"
                  />
                  <label htmlFor="front-upload">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Front
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Back View</label>
                <div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e, 'back')}
                    className="hidden"
                    id="back-upload"
                  />
                  <label htmlFor="back-upload">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Back
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Recorded Media Preview */}
          {recordedMedia.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Recorded Media</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recordedMedia.map((media) => (
                  <Card key={media.id} className="overflow-hidden">
                    <div className="relative">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt="Recorded media"
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 capitalize">
                        {media.position}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        {media.type.toUpperCase()} • {new Date(media.timestamp).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}