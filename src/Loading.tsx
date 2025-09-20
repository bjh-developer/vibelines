/**
 * Loading page component that handles Spotify authentication, data analysis, and timeline generation
 * This component orchestrates the entire flow from authentication to mood analysis
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from "./components/AuroraBG";
import {
  isAuthenticated,
  getCurrentUser,
  handleSpotifyCallback,
  getAllLikedSongs,
  type SpotifyUser,
} from "./utils/spotifyAuth";
import { supabase } from "./utils/supabaseClient";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { analyzeSongMoods } from "./utils/emotionApi";

// Types and Interfaces
interface MoodsAndDatesData {
  track_name: string;
  artist_name: string;
  date_added: string;
  predicted_moods: string[] | null;
}

interface TimelineData {
  Chapters: Record<string, string>;
  Phases: Record<string, string>;
  Contents: Record<string, string>;
  Soundtracks: Record<string, string>;
}

// Constants
const LOADING_MESSAGES = {
  CONNECTING: "Connecting to Spotify...",
  AUTHENTICATING: "Authenticating with Spotify...",
  PROFILE: "Loading your profile...",
  SONGS: "Fetching your liked songs...",
  ANALYSING: "Checking songs in database and analysing...",
  TIMELINE: "Creating your timeline...",
  COMPLETE: "Personalized timeline generated!",
} as const;

const AURORA_CONFIG = {
  colorStops: ["#7CFF67", "#B19EEF", "#5227FF"] as string[],
  blend: 0.5,
  amplitude: 0.5,
  speed: 1,
};

/**
 * Custom hook for database operations
 */
const useDatabaseOperations = () => {
  const testConnection = async () => {
    try {
      console.log("🔌 Testing Supabase connection...");
      const { data, error } = await supabase
        .from("song_mood_analysis")
        .select("song_title, artist_name")
        .limit(1);
      console.log("🔌 Supabase test data:", data);

      if (error) {
        console.error("❌ Supabase connection test failed:", error);
        throw error;
      } else {
        console.log("✅ Supabase connection successful");
      }
    } catch (err) {
      console.error("❌ Supabase connection error:", err);
      throw err;
    }
  };

  const checkSongExists = async (songTitle: string, artistName: string) => {
    console.log(`🔍 Checking database for: "${songTitle}" by "${artistName}"`);

    const { data: existingTrack, error: fetchError } = await supabase
      .from("song_mood_analysis")
      .select("*")
      .eq("song_title", songTitle)
      .eq("artist_name", artistName)
      .single();

    if (fetchError) {
      console.log(`📝 Database query error for "${songTitle}":`, {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });

      if (fetchError.code !== "PGRST116") {
        console.error(
          `❌ Unexpected error checking track "${songTitle}":`,
          fetchError
        );
        throw fetchError;
      }
    }

    return existingTrack;
  };

  const saveSongMood = async (songData: {
    song_title: string;
    artist_name: string;
    predicted_moods: string[];
    album_name?: string;
  }) => {
    const insertData = {
      ...songData,
      song_title_normalised: songData.song_title.toLowerCase(),
      artist_name_normalised: songData.artist_name.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("📝 Insert data:", insertData);

    const { error } = await supabase
      .from("song_mood_analysis")
      .insert(insertData)
      .select();

    if (error) {
      console.error("❌ Error saving to database:", error);
      throw error;
    }
  };

  return { testConnection, checkSongExists, saveSongMood };
};

/**
 * Custom hook for mood analysis operations
 */
const useMoodAnalysis = () => {
  const getMoodFromAPI = async (
    songTitle: string,
    artistName: string
  ): Promise<string[] | null> => {
    try {
      console.log(
        `🎭 Calling mood analysis API for: "${songTitle}" by ${artistName}`
      );
      const result = await analyzeSongMoods(songTitle, artistName);
      return result.predicted_moods;
    } catch (error) {
      console.error(
        `❌ Error calling mood analysis API for "${songTitle}" by ${artistName}:`,
        error
      );
      return null;
    }
  };

  return { getMoodFromAPI };
};

/**
 * Custom hook for timeline generation
 */
const useTimelineGeneration = () => {
  const estimateTokens = (text: string): number => {
    const normalizedText = text.trim().replace(/\s+/g, " ");
    const charBasedEstimate = Math.ceil(normalizedText.length / 4);
    return Math.ceil(charBasedEstimate * 1.1);
  };

  const extractJSONFromResponse = (responseText: string): string => {
    // Extract JSON from markdown code blocks if present
    if (responseText.includes("```json")) {
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        console.log("📝 Extracted JSON from markdown:", jsonMatch[1]);
        return jsonMatch[1];
      }
    } else if (responseText.includes("```")) {
      const jsonMatch = responseText.match(/```\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        console.log("📝 Extracted JSON from code block:", jsonMatch[1]);
        return jsonMatch[1];
      }
    }

    // Clean up any remaining backticks or extra whitespace
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```[a-z]*\s*/, "");
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.replace(/\s*```$/, "");
    }

    return cleanedText;
  };

  const createTimelinePrompt = (moodsData: MoodsAndDatesData[]): string => {
    const moodsDataString = JSON.stringify(moodsData);

    return `Based on the following chronological list of moods of songs a listener has liked, analyze their emotional journey and create a compelling, music-therapy-style narrative timeline of their musical vibes:

${moodsDataString}

Instructions:
Step 1: Analyze the moods data for each year individually (ONLY USE THE DATA PROVIDED IN THE LIST ABOVE). Identify dominant emotions, mood shifts, and seasonal changes within that year.
Step 2: Based on this analysis, split each year into chapters so that:
  - Every year is represented by 1-3 chapters.
  - Chapters reflect clear emotional shifts within the year.
  - No chapter spans more than 12 months unless data is sparse.
Step 3: Ensure chapters are ordered chronologically.
Step 4: For each chapter:
  - Give a creative, metaphorical title.
  - Provide an approximate date range (DO NOT include date ranges that does not exist from data).
  - Write a vivid narrative (<50 words) in second person, describing dominant emotions, transitions, and growth.
  - Highlight seasonal/temporal shifts.
  - Select a fitting soundtrack from the provided songs in that period.
Step 5: The JSON example below is only a formatting template:
  - Do NOT reuse or copy its chapter titles, phases, contents, or soundtracks.
  - Only follow the structure, keys, and formatting style.
  - All values (Chapters, Phases, Contents, Soundtracks) must come from the provided moods data.

* Make sure the number of chapters, phases, contents, and soundtracks are ALL THE SAME (e.g. 10 chapters = 10 phases = 10 contents = 10 soundtracks), phases should only be up to the latest date given in the list above.
* DO NOT INCLUDE DATE RANGE BEYOND THE LATEST DATE IN THE PROVIDED DATA.

Return ONLY valid JSON, following this format/example:
{"Chapters": {"1": "The Echoes of Love and Longing","2": "Embracing the Upbeat","3": "Unveiling Inner Strength"},"Phases": {"1": "(March - April 2018)","2": "(April - July 2018)","3": "(August 2018 - January 2019)"},"Contents": {"1": "You begin in a space of tender reflection, where love's sweetness intertwines with a gentle ache.","2": "The tempo remains elevated, celebrating life's bright moments.","3": "A powerful undercurrent surfaces, marked by anthems of resilience and introspection."},"Soundtracks": {"1": "\\"When I Was Your Man\\" by Bruno Mars","2": "\\"Perfect Strangers\\" by Jonas Blue, JP Cooper","3": "\\"Thunder\\" by Imagine Dragons"}}`;
  };

  const generateTimeline = async (
    moodsData: MoodsAndDatesData[]
  ): Promise<TimelineData> => {
    const openrouterkey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const prompt = createTimelinePrompt(moodsData);
    const estimatedMaxTokens = Math.ceil(estimateTokens(prompt) * 0.2);

    console.log(`🤖 LLM API Prompt: ${prompt}`);
    console.log(`🧮 Max reasoning tokens: ${estimatedMaxTokens}`);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterkey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: prompt }],
            },
          ],
          reasoning: {
            max_tokens: estimatedMaxTokens,
            exclude: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ LLM API call failed:", response.status, errorText);
      throw new Error(`LLM API call failed: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content;
    console.log("🎯 LLM Analysis Result:", responseText);

    const cleanedJSON = extractJSONFromResponse(responseText);

    try {
      const timelineData = JSON.parse(cleanedJSON);
      console.log("✅ Successfully parsed timeline data:", timelineData);
      return timelineData;
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      console.error("❌ Raw response text:", responseText);
      throw new Error("Failed to process timeline data");
    }
  };

  return { generateTimeline };
};

/**
 * Error display component
 */
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
    <div className="absolute inset-0 z-0">
      <Aurora {...AURORA_CONFIG} />
    </div>

    <div className="relative z-10 text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-white text-2xl font-bold mb-4">Oops!</h2>
      <p className="text-gray-400 mb-8">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-all duration-200"
      >
        Try Again
      </button>
    </div>
  </div>
);

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="mb-8">
    <Spinner className="mx-auto text-stone-50" variant="infinite" size={64} />
  </div>
);

/**
 * User welcome component
 */
const UserWelcome = ({ user }: { user: SpotifyUser | null }) => {
  if (!user) return null;

  return (
    <div className="mb-6">
      <h2 className="text-white text-2xl font-bold mb-2">
        👋 Hi there, {user.display_name}!
      </h2>
    </div>
  );
};

/**
 * Loading message display component
 */
const LoadingMessage = ({ message }: { message: string }) => (
  <div>
    <p className="text-gray-300 text-lg mb-4">{message}</p>
    <p className="text-gray-500 text-sm mt-6">
      This may take a moment depending on your library size...
    </p>
  </div>
);

/**
 * Main loading display component
 */
const LoadingDisplay = ({
  user,
  loadingMessage,
}: {
  user: SpotifyUser | null;
  loadingMessage: string;
}) => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
    {/* Aurora Background */}
    <div className="absolute inset-0 z-0">
      <Aurora {...AURORA_CONFIG} />
    </div>

    {/* Loading Content */}
    <div className="relative z-10 text-center">
      <LoadingSpinner />
      <UserWelcome user={user} />
      <LoadingMessage message={loadingMessage} />
    </div>
  </div>
);
const useLoadingState = () => {
  const [loadingMessage, setLoadingMessage] = useState<string>(
    LOADING_MESSAGES.CONNECTING
  );
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisActive, setIsAnalysisActive] = useState(true);

  const updateMessage = (message: string) => {
    console.log(`📝 Loading message: ${message}`);
    setLoadingMessage(message);
  };

  const setErrorState = (errorMessage: string) => {
    console.error(`❌ Error: ${errorMessage}`);
    setError(errorMessage);
  };

  const stopAnalysis = () => {
    setIsAnalysisActive(false);
    console.log("🛑 Analysis stopped");
  };

  return {
    loadingMessage,
    error,
    isAnalysisActive,
    updateMessage,
    setErrorState,
    stopAnalysis,
  };
};

/**
 * Main Loading component that orchestrates the entire Spotify data analysis flow
 *
 * This component handles:
 * - Spotify authentication callback processing
 * - User profile loading
 * - Liked songs fetching and analysis
 * - Mood analysis via external API
 * - Database operations for caching results
 * - Timeline generation using LLM
 * - Navigation to results page
 *
 * @returns JSX element displaying loading progress or error states
 */
export default function Loading() {
  const navigate = useNavigate();

  // Custom hooks for separated concerns
  const {
    loadingMessage,
    error,
    isAnalysisActive,
    updateMessage,
    setErrorState,
    stopAnalysis,
  } = useLoadingState();
  const { testConnection, checkSongExists, saveSongMood } =
    useDatabaseOperations();
  const { getMoodFromAPI } = useMoodAnalysis();
  const { generateTimeline } = useTimelineGeneration();

  // Local component state
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [moodsAndDatesData, setMoodsAndDatesData] = useState<
    MoodsAndDatesData[]
  >([]);

  console.log("🎵 Moods and Dates Data:", moodsAndDatesData);

  /**
   * Main function that orchestrates the Spotify data loading and analysis process
   *
   * This function:
   * 1. Tests database connectivity
   * 2. Loads Spotify user profile
   * 3. Fetches all liked songs
   * 4. Analyses each song for mood (using cache when available)
   * 5. Generates timeline using AI
   * 6. Navigates to results page
   */
  const loadSpotifyUserData = async () => {
    try {
      // Check if analysis should continue
      if (!isAnalysisActive) return;

      // Test Supabase connection first
      await testConnection();

      if (!isAnalysisActive) return;

      updateMessage(LOADING_MESSAGES.PROFILE);
      console.log("🎵 Loading Spotify user data...");
      const user = await getCurrentUser();
      setSpotifyUser(user);
      console.log("✅ User data loaded:", user.display_name);

      if (!isAnalysisActive) return;

      // Fetch all liked songs and log them
      updateMessage(LOADING_MESSAGES.SONGS);
      console.log("🎶 Fetching all liked songs...");
      const allLikedSongs = await getAllLikedSongs();

      if (!isAnalysisActive) return;

      console.log(`🎉 Retrieved ${allLikedSongs.length} liked songs:`);
      console.log("=".repeat(50));

      updateMessage(LOADING_MESSAGES.ANALYSING);

      // Array to store songs with mood data
      const moodsAndDataArray: MoodsAndDatesData[] = [];

      // Check each song in the database
      let songsInDatabase = 0;
      let songsNotInDatabase = 0;

      for (let index = 0; index < allLikedSongs.length; index++) {
        // Check if analysis should continue before processing each song
        if (!isAnalysisActive) {
          console.log("🛑 Analysis stopped by user navigation");
          return;
        }

        const track = allLikedSongs[index];
        const artistNames = track.artists
          .map((artist: any) => artist.name)
          .join(", ");
        const dateAdded = track.added_at || new Date().toISOString();

        console.log(
          `${index + 1}. "${track.name}" by ${artistNames} - Added: ${new Date(
            dateAdded
          ).toLocaleDateString()}`
        );

        try {
          // Check if song exists in database
          const existingTrack = await checkSongExists(track.name, artistNames);

          if (existingTrack) {
            // Song found in database - add to array with existing mood data
            updateMessage(
              `Analysing "${track.name}"... (${index + 1}/${
                allLikedSongs.length
              })`
            );

            console.log(
              `✅ "${track.name}" found in database with mood: ${
                existingTrack.predicted_moods || "No mood data"
              }`
            );
            moodsAndDataArray.push({
              track_name: track.name,
              artist_name: artistNames,
              date_added: dateAdded,
              predicted_moods: existingTrack.predicted_moods || null,
            });
            songsInDatabase++;
          } else {
            // Song not found in database - call API for mood analysis
            console.log(
              `🔍 "${track.name}" not found in database - calling API for mood analysis...`
            );

            updateMessage(
              `Analysing "${track.name}"... (${index + 1}/${
                allLikedSongs.length
              })`
            );

            const predictedMoods = await getMoodFromAPI(
              track.name,
              artistNames
            );

            // Check again after API call in case user navigated away
            if (!isAnalysisActive) {
              console.log("🛑 Analysis stopped after API call");
              return;
            }

            moodsAndDataArray.push({
              track_name: track.name,
              artist_name: artistNames,
              date_added: dateAdded,
              predicted_moods: predictedMoods,
            });

            if (predictedMoods) {
              console.log(
                `🎯 API analysis complete for "${
                  track.name
                }": ${predictedMoods.join(", ")}`
              );

              // Save to database for future use
              await saveSongMood({
                song_title: track.name,
                artist_name: artistNames,
                predicted_moods: predictedMoods,
                album_name: track.album?.name,
              });
            }

            songsNotInDatabase++;
          }
        } catch (dbError) {
          console.error(`❌ Database error for "${track.name}":`, dbError);
          songsNotInDatabase++;
        }
      }

      // Sort array chronologically by date_added (oldest to newest)
      moodsAndDataArray.sort(
        (a, b) =>
          new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
      );

      // Update state with the sorted array
      setMoodsAndDatesData(moodsAndDataArray);

      console.log("🎵 Chronologically sorted songs with moods:");
      console.log(JSON.stringify(moodsAndDataArray));

      updateMessage(LOADING_MESSAGES.TIMELINE);

      // Generate timeline using the hook
      try {
        console.log("🤖 Calling LLM API for timeline analysis...");
        const timelineData = await generateTimeline(moodsAndDataArray);

        updateMessage(LOADING_MESSAGES.COMPLETE);
        navigate("/moodtimeline", { state: { timeline: timelineData } });
      } catch (llmError) {
        console.error("❌ Error calling LLM API:", llmError);
        setErrorState("Failed to generate timeline. Please try again.");
      }
    } catch (error) {
      console.error("Error loading Spotify data:", error);
      setErrorState("Failed to load your Spotify data. Please try again.");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      // Handle callback from Spotify
      updateMessage(LOADING_MESSAGES.AUTHENTICATING);
      handleSpotifyCallback(code, state).then((success) => {
        if (success) {
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          // Load user data and liked songs
          loadSpotifyUserData();
        } else {
          setErrorState("Authentication failed. Please try again.");
        }
      });
    } else if (isAuthenticated()) {
      // Already authenticated, just load data
      loadSpotifyUserData();
    } else {
      // Not authenticated, redirect back to home
      navigate("/");
    }

    // Cleanup function to stop analysis when component unmounts
    return () => {
      stopAnalysis();
    };
  }, [navigate]);

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          stopAnalysis();
          navigate("/");
        }}
      />
    );
  }

  return <LoadingDisplay user={spotifyUser} loadingMessage={loadingMessage} />;
}
