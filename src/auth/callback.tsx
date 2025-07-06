import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    async function exchangeCodeForToken() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const verifier = sessionStorage.getItem("spotify_code_verifier");

      if (!code || !verifier) {
        console.error("Missing code or verifier");
        return;
      }

      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        navigate("/dashboard"); // your post-login page
      } else {
        console.error("Token exchange failed", data);
      }
    }

    exchangeCodeForToken();
  }, []);

  return <p>Logging in...</p>;
};

export default CallbackPage;
