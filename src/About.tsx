import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";
import { useHaptic } from "use-haptic";

export default function About() {
  const { triggerHaptic } = useHaptic();
  const navigate = useNavigate();

  const handleBackToHome = () => {
    triggerHaptic();
    startViewTransition(() => {
      navigate("/", { viewTransition: true });
    });
  };

  return (
    <div className="min-h-screen w-full bg-black relative" style={{ minHeight: 'max(100vh, 100dvh)' }}>
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0" style={{ height: 'max(100vh, 100dvh)' }}>
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.5}
          speed={1}
        />
      </div>

      {/* Content Container - positioned below BubbleMenu */}
      <div className="relative z-10 w-full min-h-screen pt-10 md:pt-20 px-4" style={{ minHeight: 'max(100vh, 100dvh)' }}>
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl text-center flex-1 flex flex-col items-center justify-center py-8 md:py-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 md:mb-12">
              About Vibelines
            </h1>

            <div className="text-gray-300 text-base md:text-lg lg:text-xl space-y-6 mb-12 leading-relaxed">
              <p>
                Inspired by{" "}
                <a
                  href="https://www.instagram.com/reel/DLiS7qfSMjM/?igsh=MTByZG96Y2w0ZjVjcQ=="
                  className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @ayitsphotography's IG story about liked songs playlist
                </a>
                .
              </p>

              <p>
                I wanted to transform my Spotify liked songs' playlist into an
                emotional journey, creating a beautiful timeline that visualises
                the mood and sentiment of my music.
              </p>
              <p>
                <strong>Thus,</strong> Vibelines was born.
              </p>

              <p>
                Using{" "}
                <a
                  href="https://huggingface.co/amaai-lab/music2emo"
                  target="_blank"
                  className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
                >
                  state-of-the-art Music Emotion Recognition model
                </a>{" "}
                and{" "}
                <a
                  href="https://deepmind.google/models/gemini/flash-lite/"
                  target="_blank"
                  className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline"
                >
                  Large Language Model
                </a>
                , Vibelines analyses your liked songs to understand the
                emotional landscape of your musical taste, presenting it as an
                interactive visual experience.
              </p>

              <p>
                Discover patterns in your listening habits and see how your
                musical emotions evolve over time. Reminiscence your past
                through the soundtrack of your life.
              </p>

              <p>
                <a href="https://github.com/bjh-developer/vibelines" target="_blank" rel="noopener noreferrer" className="text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline">
                  This website is open sourced!
                </a>
              </p>
            </div>

            <button
              onClick={handleBackToHome}
              className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 border-0 cursor-pointer text-base md:text-lg"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
