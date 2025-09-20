import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";
import { useHaptic } from "use-haptic";

// Constants for better maintainability
const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"],
  blend: 0.5,
  amplitude: 0.5,
  speed: 1,
};

const EXTERNAL_LINKS = {
  inspiration:
    "https://www.instagram.com/reel/DLiS7qfSMjM/?igsh=MTByZG96Y2w0ZjVjcQ==",
  musicModel: "https://huggingface.co/amaai-lab/music2emo",
  llmModel: "https://deepmind.google/models/gemini/flash-lite/",
  githubRepo: "https://github.com/bjh-developer/vibelines",
} as const;

/**
 * About page component that displays information about Vibelines
 * Includes background story, technology used, and navigation back to home
 */
export default function About() {
  const { triggerHaptic } = useHaptic();
  const navigate = useNavigate();

  const handleBackToHome = () => {
    triggerHaptic();
    startViewTransition(() => {
      navigate("/", { viewTransition: true });
    });
  };

  /**
   * External link component with consistent styling
   */
  interface ExternalLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
  }

  const ExternalLink = ({
    href,
    children,
    className = "",
  }: ExternalLinkProps) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-[#7CFF67] hover:text-[#8FFF7C] transition-colors underline ${className}`}
    >
      {children}
    </a>
  );

  /**
   * Content paragraph component with consistent spacing
   */
  interface ContentParagraphProps {
    children: React.ReactNode;
  }

  const ContentParagraph = ({ children }: ContentParagraphProps) => (
    <p>{children}</p>
  );

  /**
   * About content sections for better organization
   */
  const AboutContent = () => (
    <div className="text-gray-300 text-base md:text-lg lg:text-xl space-y-6 mb-12 leading-relaxed">
      <ContentParagraph>
        Inspired by{" "}
        <ExternalLink href={EXTERNAL_LINKS.inspiration}>
          @ayitsphotography's IG story about liked songs playlist
        </ExternalLink>
        .
      </ContentParagraph>

      <ContentParagraph>
        I wanted to transform my Spotify liked songs' playlist into an emotional
        journey, creating a beautiful timeline that visualises the mood and
        sentiment of my music.
      </ContentParagraph>

      <ContentParagraph>
        <strong>Thus,</strong> Vibelines was born.
      </ContentParagraph>

      <ContentParagraph>
        Using a{" "}
        <ExternalLink href={EXTERNAL_LINKS.musicModel}>
          state-of-the-art Music Emotion Recognition model
        </ExternalLink>{" "}
        and a{" "}
        <ExternalLink href={EXTERNAL_LINKS.llmModel}>
          Large Language Model
        </ExternalLink>
        , Vibelines analyses your liked songs to understand the emotional
        landscape of your musical taste, presenting it as an interactive visual
        experience.
      </ContentParagraph>

      <ContentParagraph>
        Discover patterns in your listening habits and see how your musical
        emotions evolve. Reminiscence about your past through the soundtrack of
        your life.
      </ContentParagraph>

      <ContentParagraph>
        <ExternalLink href={EXTERNAL_LINKS.githubRepo}>
          This website is open sourced!
        </ExternalLink>
      </ContentParagraph>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full bg-black relative"
      style={{ minHeight: "max(100vh, 100dvh)" }}
    >
      {/* Aurora Background */}
      <div
        className="fixed inset-0 z-0"
        style={{ height: "max(100vh, 100dvh)" }}
      >
        <Aurora {...AURORA_CONFIG} />
      </div>

      {/* Content Container */}
      <div
        className="relative z-10 w-full min-h-screen pt-10 md:pt-20 px-4"
        style={{ minHeight: "max(100vh, 100dvh)" }}
      >
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl text-center flex-1 flex flex-col items-center justify-center py-8 md:py-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 md:mb-12">
              About Vibelines
            </h1>

            <AboutContent />

            <button
              onClick={handleBackToHome}
              className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 border-0 cursor-pointer text-base md:text-lg"
              aria-label="Navigate back to home page"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
