import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import * as Tesseract from 'tesseract.js';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [captured, setCaptured] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [cameras, setCameras] = useState<{ name: string; id: string }[]>([]);
  const [stream, setStream] = useState<MediaStream>();
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(gotDevices);
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (video)
      navigator.mediaDevices
        .getUserMedia({
          video: selected === '' ? { facingMode: 'environment' } : { deviceId: { exact: selected } },
          audio: false,
        })
        .then((stream) => {
          setStream(stream);
        });
  }, [selected]);

  const gotDevices = (mediaDevices: MediaDeviceInfo[]) => {
    let count = 1;
    mediaDevices.forEach((mediaDevice) => {
      if (mediaDevice.kind === 'videoinput')
        setCameras((arr) => [...arr, { name: mediaDevice.label || `Camera ${count++}`, id: mediaDevice.deviceId }]);
    });
  };
  function stopMediaTracks(s: MediaStream) {
    s.getTracks().forEach((track) => {
      track.stop();
    });
  }

  const changeCamera = (id: string) => {
    if (typeof stream !== 'undefined') {
      stopMediaTracks(stream);
    }
    setSelected(id);
  };

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
          <select>
            {cameras.map((camera, key) => (
              <option key={key} onClick={() => changeCamera(camera.id)}>
                {camera.name}
              </option>
            ))}
          </select>
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

