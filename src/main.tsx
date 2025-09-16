import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import App from "./App.tsx"
import Loading from "./Loading.tsx"
import MoodTimeline from "./MoodTimeline.tsx"
import About from "./About.tsx"
import Contact from "./Contact.tsx"
import PrivacyPolicy from "./PrivacyPolicy.tsx"
import FAQ from "./FAQ.tsx"
import SpotifyCallback from "./components/SpotifyCallback.tsx"

// Create router with view transitions support
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/callback',
    element: <SpotifyCallback />
  },
  {
    path: '/loading',
    element: <Loading />
  },
  {
    path: '/moodtimeline',
    element: <MoodTimeline />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/contact',
    element: <Contact />
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />
  },
  {
    path: '/faq',
    element: <FAQ />
  }
])

// Handle mobile viewport height issues
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set initial viewport height
setViewportHeight();

// Update on resize and orientation change
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});

createRoot(document.getElementById("root")!).render(
  <>
    <RouterProvider router={router} />
    <Analytics />
  </>
)