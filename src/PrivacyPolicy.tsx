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
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <p>
              When you connect your Spotify account, we access your liked songs 
              playlist information to analyse the emotional content of your music. We do not 
              store your personal information or listening data permanently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Data</h2>
            <p>
              Your music data is processed in real-time to generate emotional analysis and 
              create your personalized Vibelines timeline. This data is used solely for 
              providing the service and is not shared with third parties. Emotions of songs are stored
              in our database to optimize performance, but no personal identifiers are kept.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information. 
              All data processing is done securely and in compliance with Spotify's 
              API terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact me 
              through my contact page.
            </p>
          </section>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors border-0 cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
