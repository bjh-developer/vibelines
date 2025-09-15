import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from "./App.tsx"
import Loading from "./Loading.tsx"
import MoodTimeline from "./MoodTimeline.tsx"
import About from "./About.tsx"
import Contact from "./Contact.tsx"
import PrivacyPolicy from "./PrivacyPolicy.tsx"
import FAQ from "./FAQ.tsx"

// Create router with view transitions support
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/callback',
    element: <Loading />
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

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
)