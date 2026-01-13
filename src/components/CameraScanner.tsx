import React, { useRef, useState, useCallback, useEffect } from 'react';
import '../styles/CameraScanner.css';

interface Props {
  onCapture: (imageBlob: Blob) => void;
  onClose: () => void;
  fieldLabel: string;
}

const CameraScanner: React.FC<Props> = ({ onCapture, onClose, fieldLabel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
      setStream(mediaStream);
    } catch (err) {
      setError('Nije moguće pristupiti kameri. Molimo dozvolite pristup kameri.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate the scan area (narrow horizontal strip in center)
    // The scan area is 80% width, 15% height, centered
    const scanAreaWidth = videoWidth * 0.8;
    const scanAreaHeight = videoHeight * 0.15;
    const scanAreaX = (videoWidth - scanAreaWidth) / 2;
    const scanAreaY = (videoHeight - scanAreaHeight) / 2;

    // Set canvas to scan area size
    canvas.width = scanAreaWidth;
    canvas.height = scanAreaHeight;

    // Draw only the scan area portion
    ctx.drawImage(
      video,
      scanAreaX, scanAreaY, scanAreaWidth, scanAreaHeight,  // Source rectangle
      0, 0, scanAreaWidth, scanAreaHeight                    // Destination rectangle
    );

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
          stopCamera();
        }
      },
      'image/jpeg',
      0.95
    );
  }, [isReady, onCapture]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="camera-overlay">
      <div className="camera-container">
        <div className="camera-header">
          <span className="field-label">Skeniraj: {fieldLabel}</span>
          <button className="close-camera-btn" onClick={handleClose}>&times;</button>
        </div>

        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <button onClick={handleClose}>Zatvori</button>
          </div>
        ) : (
          <>
            <div className="video-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              {/* Overlay with transparent scan area */}
              <div className="scan-overlay">
                <div className="scan-area-top" />
                <div className="scan-area-middle">
                  <div className="scan-area-left" />
                  <div className="scan-area-center">
                    <div className="scan-corners">
                      <span className="corner top-left" />
                      <span className="corner top-right" />
                      <span className="corner bottom-left" />
                      <span className="corner bottom-right" />
                    </div>
                  </div>
                  <div className="scan-area-right" />
                </div>
                <div className="scan-area-bottom" />
              </div>
              <div className="scan-instruction">
                Pozicionirajte tekst unutar pravougaonika
              </div>
            </div>

            <div className="camera-actions">
              <button
                className="capture-btn"
                onClick={captureImage}
                disabled={!isReady}
              >
                {isReady ? 'Snimi' : 'Učitavanje...'}
              </button>
            </div>
          </>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CameraScanner;
