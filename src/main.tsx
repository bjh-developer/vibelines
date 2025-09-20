/**
 * Main entry point for the Vibelines React application
 * Sets up routing, analytics, and viewport handling for mobile devices
 */

import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Analytics and performance monitoring
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Page components
import App from "./App.tsx";
import Loading from "./Loading.tsx";
import MoodTimeline from "./MoodTimeline.tsx";
import About from "./About.tsx";
import Contact from "./Contact.tsx";
import PrivacyPolicy from "./PrivacyPolicy.tsx";
import FAQ from "./FAQ.tsx";
import SpotifyCallback from "./components/SpotifyCallback.tsx";

// Constants
const APP_CONFIG = {
  ROOT_ELEMENT_ID: "root",
  ORIENTATION_CHANGE_DELAY: 100,
  VIEWPORT_HEIGHT_CUSTOM_PROPERTY: "--vh",
} as const;

// Route configuration for better maintainability
const ROUTES = [
  {
    path: "/",
    element: <App />,
    name: "Home",
  },
  {
    path: "/callback",
    element: <SpotifyCallback />,
    name: "Spotify Callback",
  },
  {
    path: "/loading",
    element: <Loading />,
    name: "Loading",
  },
  {
    path: "/moodtimeline",
    element: <MoodTimeline />,
    name: "Mood Timeline",
  },
  {
    path: "/about",
    element: <About />,
    name: "About",
  },
  {
    path: "/contact",
    element: <Contact />,
    name: "Contact",
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
    name: "Privacy Policy",
  },
  {
    path: "/faq",
    element: <FAQ />,
    name: "FAQ",
  },
];

// Create router with view transitions support
const router = createBrowserRouter(ROUTES);

/**
 * Viewport utilities for handling mobile viewport height issues
 * Addresses the issue where mobile browsers change viewport height dynamically
 */
const ViewportUtils = {
  /**
   * Sets CSS custom property for consistent viewport height across devices
   * Uses actual window.innerHeight to avoid mobile browser UI inconsistencies
   */
  setViewportHeight: () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty(
      APP_CONFIG.VIEWPORT_HEIGHT_CUSTOM_PROPERTY,
      `${vh}px`
    );
  },

  /**
   * Initialises viewport height handling with event listeners
   * Handles both resize events and orientation changes
   */
  initialise: () => {
    // Set initial viewport height
    ViewportUtils.setViewportHeight();

    // Update on resize
    window.addEventListener("resize", ViewportUtils.setViewportHeight);

    // Update on orientation change with small delay for mobile browsers
    window.addEventListener("orientationchange", () => {
      setTimeout(
        ViewportUtils.setViewportHeight,
        APP_CONFIG.ORIENTATION_CHANGE_DELAY
      );
    });
  },
};

/**
 * App component that wraps the router with analytics
 */
const AppWithAnalytics = () => (
  <>
    <RouterProvider router={router} />
    <Analytics />
    <SpeedInsights />
  </>
);

/**
 * Initialise the application
 */
const initialiseApp = () => {
  try {
    // Initialise viewport handling for mobile devices
    ViewportUtils.initialise();

    // Get root element and render the app
    const rootElement = document.getElementById(APP_CONFIG.ROOT_ELEMENT_ID);
    if (!rootElement) {
      throw new Error(
        `Root element not found. Make sure there's a div with id='${APP_CONFIG.ROOT_ELEMENT_ID}' in your HTML.`
      );
    }

    // Create and render the app
    const root = createRoot(rootElement);
    root.render(<AppWithAnalytics />);

    console.log("✅ Vibelines app initialised successfully");
  } catch (error) {
    console.error("❌ Failed to initialise Vibelines app:", error);

    // Fallback error display
    document.body.innerHTML = `
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        background: black; 
        color: white; 
        font-family: system-ui;
        text-align: center;
      ">
        <div>
          <h1>🚫 Application Error</h1>
          <p>Failed to load Vibelines. Please refresh the page.</p>
          <button onclick="location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #1DB954;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
};

// Start the application
initialiseApp();
