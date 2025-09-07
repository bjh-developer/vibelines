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
          Get in Touch
        </h1>
        
        <div className="text-gray-300 text-lg md:text-xl space-y-8 mb-12">
          <p>
            Have questions, feedback, or just want to say hello?
          </p>
          
          <div className="space-y-4">
            <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
              <a 
                href="https://www.instagram.com/_b.jh_/" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                @_b.jh_
              </a>
            </div>

            <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-2">LinkedIn</h3>
              <a 
                href="https://www.linkedin.com/in/bek-joon-hao/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Connect with Joon Hao
              </a>
            </div>

            <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-2">Email</h3>
              <a 
                href="mailto:joonhaobek@gmail.com" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                joonhaobek@gmail.com
              </a>
            </div>
            
          </div>
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
