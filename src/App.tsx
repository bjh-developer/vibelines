import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CallbackPage from "./pages/CallbackPage";
import LikedSongsPage from "./pages/LikedSongsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/dashboard" element={<LikedSongsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
