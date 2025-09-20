/**
 * PrivacyPolicy Component
 *
 * A comprehensive privacy policy page that explains how user data is collected,
 * processed, and managed within the Vibelines application. Features transparent
 * information about Spotify integration, data usage, and user rights.
 *
 * Key Features:
 * - Clear data collection and usage explanations
 * - Information about Spotify integration and permissions
 * - Instructions for revoking access
 * - Contact information for privacy concerns
 * - Responsive design with Aurora background
 * - Smooth navigation transitions
 *
 * @returns {React.ReactElement} The complete privacy policy interface
 */

// React
import React from "react";

// React Router
import { useNavigate } from "react-router-dom";

// Components
import Aurora from "./components/AuroraBG";

// Hooks and Utilities
import { startViewTransition } from "./utils/viewTransitions";
import { useHaptic } from "use-haptic";

// Types and Interfaces
interface PolicySection {
  id: string;
  title: string;
  content: string;
  hasExternalLink?: boolean;
  externalLink?: {
    url: string;
    text: string;
  };
}

// Constants
const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"] as string[],
  blend: 0.5,
  amplitude: 0.25,
  speed: 1,
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "information-collection",
    title: "Information We Collect",
    content:
      "When you connect your Spotify account, we access your liked songs playlist information to analyse the emotional content of your music. We do not store your personal information or listening data permanently.",
  },
  {
    id: "data-usage",
    title: "How We Use Your Data",
    content:
      "Your music data is processed in real-time to generate emotional analysis and create your personalised Vibelines timeline. This data is used solely for providing the service and is not shared with third parties. Emotions of songs are stored in our database to optimise performance, but no personal identifiers are kept.",
  },
  {
    id: "revoke-permission",
    title: "Revoke Permission",
    content:
      "You can revoke access to your Spotify data at any time by disconnecting your account. This will stop all data processing and delete any stored information related to your account.",
    hasExternalLink: true,
    externalLink: {
      url: "https://support.spotify.com/us/article/spotify-on-other-apps/",
      text: "Here's",
    },
  },
  {
    id: "contact",
    title: "Contact Me",
    content:
      "If you have any questions about this Privacy Policy, please contact me through my contact page.",
  },
];

const UI_CONFIG = {
  navigation: {
    backButtonText: "← Back to Home",
  },
  meta: {
    lastUpdated: new Date().toLocaleDateString(),
  },
};

/**
 * Page header component with title and last updated date
 */
interface PageHeaderProps {
  lastUpdated: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ lastUpdated }) => (
  <div className="text-center mb-8 md:mb-12">
    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
      Privacy Policy
    </h1>
    <p className="text-gray-400 text-sm md:text-base">
      Last updated: {lastUpdated}
    </p>
  </div>
);

/**
 * Individual policy section component
 */
interface PolicySectionComponentProps {
  section: PolicySection;
}

const PolicySectionComponent: React.FC<PolicySectionComponentProps> = ({
  section,
}) => (
  <section>
    <h2 className="text-lg md:text-xl font-semibold text-white mb-3">
      {section.title}
    </h2>
    <p className="text-sm md:text-base leading-relaxed">
      {section.content}
      {section.hasExternalLink && section.externalLink && (
        <>
          {" "}
          <a
            href={section.externalLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            {section.externalLink.text}
          </a>{" "}
          a guide on how you can do it.
        </>
      )}
    </p>
  </section>
);

/**
 * Navigation button component
 */
interface NavigationButtonProps {
  onClick: () => void;
  text: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  text,
}) => (
  <div className="text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 border-0 cursor-pointer text-base md:text-lg"
    >
      {text}
    </button>
  </div>
);

/**
 * Hook for managing navigation with haptic feedback
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

export default function PrivacyPolicy(): React.ReactElement {
  // Custom hooks
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
        <Aurora
          colorStops={AURORA_CONFIG.colorStops}
          blend={AURORA_CONFIG.blend}
          amplitude={AURORA_CONFIG.amplitude}
          speed={AURORA_CONFIG.speed}
        />
      </div>

      {/* Content Container */}
      <div
        className="relative z-10 w-full min-h-screen pt-10 md:pt-20 px-4"
        style={{ minHeight: "max(100vh, 100dvh)" }}
      >
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl py-8 md:py-12">
            <PageHeader lastUpdated={UI_CONFIG.meta.lastUpdated} />

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-8 space-y-6 text-gray-300 mb-8">
              {POLICY_SECTIONS.map((section) => (
                <PolicySectionComponent key={section.id} section={section} />
              ))}
            </div>

            <NavigationButton
              onClick={handleBackToHome}
              text={UI_CONFIG.navigation.backButtonText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
