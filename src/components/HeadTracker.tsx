import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface HeadTrackerProps {
  onTilt: (tilt: 'left' | 'right' | 'center') => void;
  isActive: boolean;
}

export const HeadTracker: React.FC<HeadTrackerProps> = ({ onTilt, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const initLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      landmarkerRef.current = landmarker;
      setIsLoaded(true);
    };

    initLandmarker();

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isActive) return;

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLoaded, isActive]);

  useEffect(() => {
    if (!isLoaded || !isActive) return;

    const detect = () => {
      if (videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
        const startTimeMs = performance.now();
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Landmark 33: Left eye outer (from model's perspective, usually right side of image)
          // Landmark 263: Right eye outer (from model's perspective, usually left side of image)
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];

          // Calculate angle. In mirrored view, we want the tilt to match the visual direction.
          const dy = rightEye.y - leftEye.y;
          const dx = rightEye.x - leftEye.x;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          // Threshold for tilt - adjusted for mirrored coordinate space
          // If angle is positive, right eye is lower than left eye (tilt to model's right)
          // In mirrored view, model's right is screen's left.
          if (angle > 12) {
            onTilt('left');
          } else if (angle < -12) {
            onTilt('right');
          } else {
            onTilt('center');
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isLoaded, isActive, onTilt]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black border-2 border-white/10 shadow-2xl">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm animate-pulse">
          LOADING TRACKER...
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover scale-x-[-1]"
        playsInline
        muted
      />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-white uppercase tracking-widest opacity-70">
          {isActive ? 'Camera Active' : 'Camera Off'}
        </span>
      </div>
    </div>
  );
};
