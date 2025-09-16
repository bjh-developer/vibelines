import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";
import { useHaptic } from "use-haptic";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const { triggerHaptic } = useHaptic();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const handleBackToHome = () => {
    triggerHaptic();
    startViewTransition(() => {
      navigate("/", { viewTransition: true });
    });
  };

  const toggleItem = (index: number) => {
    triggerHaptic();
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs: FAQItem[] = [
    {
      question: "How does Vibelines analyse my music?",
      answer:
        "Vibelines uses Music2Emo's Music Emotion Recognition model to analyse various musical features like key and chords of your songs.",
    },
    {
      question: "Is my Spotify data safe?",
      answer:
        "Yes. Vibelines only access your liked songs playlist and does not retrieve any personal information. Vibelines only store anonymised emotional data to improve its service. You can revoke access at any time through your Spotify account settings.",
    },
    {
      question: "Do I need a Spotify Premium account?",
      answer:
        "No, Vibelines works with both free and premium Spotify accounts.",
    },
    {
      question: "Can I use Vibelines with other music platforms?",
      answer:
        "Currently, Vibelines only supports Spotify integration. I'm considering adding support for other platforms like Apple Music and YouTube Music in the future based on user demand.",
    },
    {
      question: "How often is my timeline updated?",
      answer:
        "Your Vibelines timeline is generated in real-time based on your current liked songs. Each time you use the service, it will reflect your most up-to-date liked songs playlist from Spotify.",
    },
    {
      question: "Is Vibelines free to use?",
      answer:
        "Yes, Vibelines is completely free to use. However, if you find Vibelines interesting, consider supporting its development through the Buy Me a Coffee link on the homepage.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-black relative" style={{ minHeight: 'max(100vh, 100dvh)' }}>
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0" style={{ height: 'max(100vh, 100dvh)' }}>
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.25}
          speed={1}
        />
      </div>

      {/* Content Container - positioned below BubbleMenu */}
      <div className="relative z-10 w-full min-h-screen pt-10 md:pt-20 px-4" style={{ minHeight: 'max(100vh, 100dvh)' }}>
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl py-8 md:py-12">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                FAQ
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                Everything you need to know about Vibelines
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-4 md:px-8 md:py-6 text-left hover:bg-white/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm md:text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                          openItems.has(index) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  {openItems.has(index) && (
                    <div className="px-6 pb-4 md:px-8 md:pb-6">
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
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
    </div>
  );
}
