import { useState, useEffect, useCallback } from '//resources/ui/ui.rollup.js';

const App = () => {
  const [time, setTime] = useState(0); // Time in seconds

  // Format time into HH:MM:SS
  const formatTime = useCallback((time) => {
    const hours = Math.floor(time / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, []);

  // Increment the timer every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Hello, World!</h1>
      <h2>{formatTime(time)}</h2>
    </div>
  );
};

export default App;
