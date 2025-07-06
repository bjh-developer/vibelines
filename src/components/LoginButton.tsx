import { redirectToSpotifyLogin } from "../auth/login";

const LoginButton = () => {
  return (
    <button onClick={redirectToSpotifyLogin}>
      Log in with Spotify
    </button>
  );
};

export default LoginButton;
