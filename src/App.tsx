import React, { useEffect, useState, useRef } from 'react';
import * as Tesseract from 'tesseract.js';
import './App.css';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [captured, setCaptured] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [cameras, setCameras] = useState<{ name: string; id: string }[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [stream, setStream] = useState<MediaStream>();

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

  useEffect(() => {
    if (cameras.length > 0) changeCamera(cameras[0].id);
  }, [cameras]);

  const gotDevices = (mediaDevices: MediaDeviceInfo[]) => {
    let count = 1;
    setCameras([]);
    mediaDevices.forEach((mediaDevice) => {
      if (mediaDevice.kind === 'videoinput')
        setCameras((arr) => [...arr, { name: mediaDevice.label || `Camera ${count++}`, id: mediaDevice.deviceId }]);
    });
  };

  const stopMediaTracks = (s: MediaStream) => {
    s.getTracks().forEach((track) => {
      track.stop();
    });
  };

  const changeCamera = (id: string) => {
    if (typeof stream !== 'undefined') {
      stopMediaTracks(stream);
    }
    setSelected(id);
  };

  const detectText = async (image: string) => {
    const text = await Tesseract.recognize(image, 'eng', {
      logger: (log) => {
        console.log(log);
        setStatus(log.status);
        setProgress(log.progress);
      },
    }).catch((err) => {
      console.error(err);
      setStatus(err);
    });
    return text!.data.text;
  };

  const start = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL();
      const text = await detectText(image);
      setCaptured((arr) => [text, ...arr]);
    }
  };
  return (
    <div className="app">
      <progress className="progress" value={progress} />
      <p className="status">Status: {status}</p>
      <div className="info">
        <select onChange={(elem) => changeCamera(elem.currentTarget.value)}>
          {cameras.map((camera, key) => (
            <option key={key}>{camera.name}</option>
          ))}
        </select>
      </div>
      <div className="wrap">
        <video className="media" ref={videoRef}></video>
        <canvas className="media" ref={canvasRef}></canvas>
      </div>

      <button onClick={start} className="captureButton">
        Capture
      </button>

      <h4 className="last">{captured[0]}</h4>

      <div className="capturedWrap">
        {captured.slice(1).map((value, key) => {
          return (
            <p key={key} className="captured">
              {value}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default App;

