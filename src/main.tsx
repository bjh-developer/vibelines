import { createRoot } from "react-dom/client"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from "./App.tsx"
import Loading from "./Loading.tsx"
import MoodTimeline from "./MoodTimeline.tsx"

createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/callback' element={<Loading />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/moodtimeline" element={<MoodTimeline />} />
    </Routes>
  </Router>
)