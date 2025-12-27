import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// --- THE CRASH FIX (Polyfills) ---
// This forces the phone to act like a computer immediately
if (typeof window !== 'undefined') {
  (window as any).global = window;
  // Temporary buffer fix for simple apps
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false,
      from: (data: any) => new Uint8Array(data),
    };
  }
}

// --- THE TRAP (Error Reporter) ---
const rootElement = document.getElementById("root");

try {
  if (!rootElement) throw new Error("Root element not found");
  createRoot(rootElement).render(<App />);
} catch (error: any) {
  // If the app crashes, PRINT the error to the screen
  document.body.innerHTML = `
    <div style="padding: 24px; color: #ef4444; font-family: system-ui; word-break: break-word;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">App Crash Detected</h1>
      <p style="font-weight: bold; margin-bottom: 8px;">Error Message:</p>
      <pre style="background: #fee2e2; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${error?.message || "Unknown Error"}</pre>
      <p style="margin-top: 16px; font-size: 14px; color: #666;">Take a screenshot of this and send it to Gemini.</p>
    </div>
  `;
  console.error(error);
}
