/**
 * Contact page component that displays contact information and social links
 * Includes navigation back to home with view transitions and haptic feedback
 */

import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";
import { useHaptic } from "use-haptic";

// Constants for better maintainability
const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"],
  blend: 0.5,
  amplitude: 0.25,
  speed: 1,
};

const CONTACT_LINKS = [
  {
    id: "instagram",
    title: "Instagram",
    href: "https://www.instagram.com/_b.jh_/",
    displayText: "@_b.jh_",
    isExternal: true,
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/bek-joon-hao/",
    displayText: "Connect with Joon Hao",
    isExternal: true,
  },
  {
    id: "email",
    title: "Email",
    href: "mailto:joonhaobek@gmail.com",
    displayText: "joonhaobek@gmail.com",
    isExternal: false,
  },
  {
    id: "github",
    title: "GitHub",
    href: "https://github.com/bjh-developer",
    displayText: "bjh-developer",
    isExternal: true,
  },
] as const;

/**
 * Individual contact link component
 */
interface ContactLinkProps {
  title: string;
  href: string;
  displayText: string;
  isExternal: boolean;
}

const ContactLink = ({
  title,
  href,
  displayText,
  isExternal,
}: ContactLinkProps) => (
  <div className="p-4 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
      {title}
    </h3>
    <a
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="text-blue-400 hover:text-blue-300 transition-colors text-base md:text-lg"
      aria-label={`Contact via ${title}: ${displayText}`}
    >
      {displayText}
    </a>
  </div>
);

/**
 * Contact links section component
 */
const ContactLinksSection = () => (
  <div className="text-gray-300 text-base md:text-lg lg:text-xl space-y-8 mb-12">
    <p className="leading-relaxed">
      Have questions, feedback, or just want to say hello?
    </p>

    <div className="space-y-4 md:space-y-6">
      {CONTACT_LINKS.map((contact) => (
        <ContactLink
          key={contact.id}
          title={contact.title}
          href={contact.href}
          displayText={contact.displayText}
          isExternal={contact.isExternal}
        />
      ))}
    </div>
  </div>
);

/**
 * Back to home button component
 */
interface BackButtonProps {
  onClick: () => void;
}

const BackButton = ({ onClick }: BackButtonProps) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 border-0 cursor-pointer text-base md:text-lg"
    aria-label="Navigate back to home page"
  >
    ← Back to Home
  </button>
);

/**
 * Custom hook for navigation with haptic feedback
 */
const useNavigationWithHaptic = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptic();

  const handleBackToHome = () => {
    triggerHaptic();
    startViewTransition(() => {
      navigate("/", { viewTransition: true });
    });
  };

  return { handleBackToHome };
};

export default function Contact() {
  const { handleBackToHome } = useNavigationWithHaptic();

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
              Get in Touch
            </h1>

            <ContactLinksSection />

            <BackButton onClick={handleBackToHome} />
          </div>
        </div>
      </div>
    </div>
  );
}
