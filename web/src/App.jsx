import { useEffect } from "react";
import "./App.scss";
import Spinner from "./components/spinner/Spinner";

function App() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <Spinner />
    </div>
  );
}

export default App;
