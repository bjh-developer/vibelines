import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";

export default function About() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    startViewTransition(() => {
      navigate("/");
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.5}
          speed={1}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">
          About Vibelines
        </h1>

        <div className="text-gray-300 text-lg md:text-xl space-y-6 mb-12">
          <p>
            Inspired by{" "}
            <a
              href="https://www.instagram.com/reel/DLiS7qfSMjM/?igsh=MTByZG96Y2w0ZjVjcQ=="
              style={{ color: "#7CFF67" }}
            >
              @ayitsphotography's IG story about liked songs playlist
            </a>
            .
          </p>

          <p>
            I wanted to transform my Spotify listening history into an emotional
            journey, creating a beautiful timeline that visualizes the mood and
            sentiment of your music.
          </p>
          <p><strong>Thus,</strong> Vibelines was born.</p>

          <p>
            Using advanced Music Emotion Recognition model and LLM, Vibelines
            analyses your favorite tracks to understand the emotional landscape
            of your musical taste, presenting it as an interactive visual
            experience.
          </p>

          <p>
            Discover patterns in your listening habits and see how your musical
            emotions evolve over time. Reminiscence your past through the
            soundtrack of your life.
          </p>
        </div>

        <button
          onClick={handleBackToHome}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors border-0 cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
