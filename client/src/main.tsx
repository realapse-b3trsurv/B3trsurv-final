import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, checkPWAInstallable } from "./lib/pwa";

registerServiceWorker();
checkPWAInstallable();

createRoot(document.getElementById("root")!).render(<App />);
