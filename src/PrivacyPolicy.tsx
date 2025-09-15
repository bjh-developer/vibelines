import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    startViewTransition(() => {
      navigate("/");
    });
  };

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={0.25}
          speed={1}
        />
      </div>

      {/* Content Container - positioned below BubbleMenu */}
      <div className="relative z-10 w-full min-h-screen pt-10 md:pt-20 px-4">
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl py-8 md:py-12">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Privacy Policy
              </h1>
              <p className="text-gray-400 text-sm md:text-base">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-8 space-y-6 text-gray-300 mb-8">
              <section>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Information We Collect</h2>
                <p className="text-sm md:text-base leading-relaxed">
                  When you connect your Spotify account, we access your liked songs 
                  playlist information to analyse the emotional content of your music. We do not 
                  store your personal information or listening data permanently.
                </p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-3">How We Use Your Data</h2>
                <p className="text-sm md:text-base leading-relaxed">
                  Your music data is processed in real-time to generate emotional analysis and 
                  create your personalised Vibelines timeline. This data is used solely for 
                  providing the service and is not shared with third parties. Emotions of songs are stored
                  in our database to optimise performance, but no personal identifiers are kept.
                </p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Revoke Permission</h2>
                <p className="text-sm md:text-base leading-relaxed">
                  You can revoke access to your Spotify data at any time by disconnecting your account.
                  This will stop all data processing and delete any stored information related to your account. 
                  <a href="https://support.spotify.com/us/article/spotify-on-other-apps/" target="_blank" className="text-white"> Here's</a> a guide on how you can do it.
                </p>
              </section>

              <section>
                <h2 className="text-lg md:text-xl font-semibold text-white mb-3">Contact Us</h2>
                <p className="text-sm md:text-base leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact me 
                  through my contact page.
                </p>
              </section>
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
