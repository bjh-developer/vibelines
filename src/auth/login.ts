// auth/login.ts
import { generateCodeChallenge, generateCodeVerifier } from "../../utils/pkce";

export async function redirectToSpotifyLogin() {
  // 1. Generate the code verifier and code challenge
  const codeVerifier = generateCodeVerifier();           // random string
  const codeChallenge = await generateCodeChallenge(codeVerifier); // hashed version

  // 2. Save the code verifier in sessionStorage for later (token exchange)
  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  // 3. Build the authorize URL with the code challenge
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: import.meta.env.VITE_SPOTIFY_SCOPES,
  });

  // 4. Redirect user to Spotify login
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}
