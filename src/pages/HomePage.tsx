import React from "react";
import LoginButton from "../components/LoginButton";

const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center
                     bg-gradient-to-b from-indigo-800 via-purple-800 to-pink-700
                     text-white px-4">
      {/* Hero section */}
      <section className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Vibelines
        </h1>

        <p className="text-lg md:text-xl">
          Discover the mood behind your music.<br />
          Log in with Spotify and watch your<br />
          emotional timeline unfold.
        </p>

        {/* 🔑 PKCE login */}
        <LoginButton />
      </section>

      {/* Footer */}
      <footer className="mt-16 text-xs opacity-70">
        Built with the&nbsp;
        <a
          href="https://developer.spotify.com/documentation/web-api"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Spotify&nbsp;Web&nbsp;API
        </a>
        . Your data never leaves your browser.
      </footer>
    </main>
  );
};

export default HomePage;
