import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import * as Tesseract from 'tesseract.js';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [captured, setCaptured] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (video)
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.play();
      });
  }, []);

  // Funzione per identificare il testo nell'immagine utilizzando Tesseract.js
  async function detectText(image: string) {
    // Usa la libreria Tesseract.js per identificare il testo nell'immagine
    const text = await Tesseract.recognize(image, 'eng', {
      logger: (log) => {
        setStatus(log.status);
        setProgress(log.progress);
      },
    }).catch((err) => {
      console.error(err);
    });
    return text!.data.text;
  }

  // Funzione principale per l'accesso alla fotocamera e il rilevamento del testo
  async function main() {
    // while (true) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL();

      // Rileva il testo nell'immagine
      const text = await detectText(image);
      setCaptured((arr) => [text, ...arr]);
    }

    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }
  return (
    <div className="App">
      <header className="App-header">
        <div className="info">
          <p>Status: {status}</p>
          <progress value={progress} />
        </div>
        <button onClick={main}>Capture</button>
        <div className="wrap">
          <video ref={videoRef}></video>
          <canvas ref={canvasRef}></canvas>
        </div>

        <h4 className="last">{captured[0]}</h4>

        <div className="capturedWrap">
          {captured.map((value, key) => {
            return (
              <p key={key} className="captured">
                {value}
              </p>
            );
          })}
        </div>
      </header>
    </div>
  );
};

export default App;

