import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "../components/Spinner";

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const storedVerifier = sessionStorage.getItem("spotify_code_verifier");

  if (!code || !storedVerifier) {
    setError("Missing authorisation code or PKCE verifier.");
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    code_verifier: storedVerifier,
  });

  fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.error || !data.access_token) {
        throw new Error(JSON.stringify(data));
      }
      localStorage.setItem("spotify_access_token", data.access_token);
      setToken(data.access_token);
      navigate("/dashboard", { replace: true });
    })
    .catch((err) => setError(`Token exchange failed: ${err}`));
}, [navigate, setToken]);

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h2>Error during login</h2>
        <p>{error}</p>
        <button onClick={() => (window.location.href = "/")} className="mt-2 underline">
          Back to login
        </button>
      </div>
    );
  }

  return <Spinner />;
};

export default CallbackPage;
