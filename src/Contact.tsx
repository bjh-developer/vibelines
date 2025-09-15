import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import { startViewTransition } from "./utils/viewTransitions";

export default function Contact() {
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
      <div className="relative z-10 w-full min-h-screen pt-20 md:pt-21 px-4">
        <div className="flex flex-col items-center justify-start min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-7rem)]">
          <div className="w-full max-w-4xl text-center flex-1 flex flex-col items-center justify-center py-8 md:py-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 md:mb-12">
              Get in Touch
            </h1>
            
            <div className="text-gray-300 text-base md:text-lg lg:text-xl space-y-8 mb-12">
              <p className="leading-relaxed">
                Have questions, feedback, or just want to say hello?
              </p>
              
              <div className="space-y-4 md:space-y-6">
                <div className="p-4 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Instagram</h3>
                  <a 
                    href="https://www.instagram.com/_b.jh_/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors text-base md:text-lg"
                  >
                    @_b.jh_
                  </a>
                </div>

                <div className="p-4 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">LinkedIn</h3>
                  <a 
                    href="https://www.linkedin.com/in/bek-joon-hao/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors text-base md:text-lg"
                  >
                    Connect with Joon Hao
                  </a>
                </div>

                <div className="p-4 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Email</h3>
                  <a 
                    href="mailto:joonhaobek@gmail.com" 
                    className="text-blue-400 hover:text-blue-300 transition-colors text-base md:text-lg"
                  >
                    joonhaobek@gmail.com
                  </a>
                </div>
                
              </div>
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
