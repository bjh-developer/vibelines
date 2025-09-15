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

// Interface for song with mood analysis
interface MoodsAndDatesData {
  track_name: string;
  artist_name: string;
  date_added: string;
  predicted_moods: string[] | null;
}

export default function Loading() {
  const navigate = useNavigate();

  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(
    "Connecting to Spotify..."
  );
  const [error, setError] = useState<string | null>(null);
  const [moodsAndDatesData, setMoodsAndDatesData] = useState<
    MoodsAndDatesData[]
  >([]);
  console.log('🎵 Moods and Dates Data:', moodsAndDatesData);
  const [isAnalysisActive, setIsAnalysisActive] = useState(true);

  const openrouterkey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log("🔌 Testing Supabase connection...");
      const { data, error } = await supabase
        .from("song_mood_analysis")
        .select("song_title, artist_name")
        .limit(1);
      console.log("🔌 Supabase test data:", data);

      if (error) {
        console.error("❌ Supabase connection test failed:", error);
      } else {
        console.log("✅ Supabase connection successful");
      }
    } catch (err) {
      console.error("❌ Supabase connection error:", err);
    }
  };

  // Function to call your API for mood analysis
  const getMoodFromAPI = async (
    songTitle: string,
    artistName: string
  ): Promise<string[] | null> => {
    try {
      const response = await fetch(
        `http://localhost:8000/analyse&predict/${encodeURIComponent(
          songTitle
        )}/${encodeURIComponent(artistName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `API call failed for "${songTitle}" by ${artistName}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();
      return data.predicted_moods || null;
    } catch (error) {
      console.error(
        `Error calling API for "${songTitle}" by ${artistName}:`,
        error
      );
      return null;
    }
  };

  // Load user data and fetch all liked songs
  const loadSpotifyUserData = async () => {
    try {
      // Check if analysis should continue
      if (!isAnalysisActive) return;

      // Test Supabase connection first
      await testSupabaseConnection();

      if (!isAnalysisActive) return;

      setLoadingMessage("Loading your profile...");
      console.log("🎵 Loading Spotify user data...");
      const user = await getCurrentUser();
      setSpotifyUser(user);
      console.log("✅ User data loaded:", user.display_name);

      if (!isAnalysisActive) return;

      // Fetch all liked songs and log them
      setLoadingMessage("Fetching your liked songs...");
      console.log("🎶 Fetching all liked songs...");
      const allLikedSongs = await getAllLikedSongs();

      if (!isAnalysisActive) return;

      console.log(`🎉 Retrieved ${allLikedSongs.length} liked songs:`);
      console.log("=".repeat(50));

      setLoadingMessage("Checking songs in database and analysing...");

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
          console.log(
            `🔍 Checking database for: "${track.name}" by "${artistNames}"`
          );
          const { data: existingTrack, error: fetchError } = await supabase
            .from("song_mood_analysis")
            .select("*")
            .eq("song_title", track.name)
            .eq("artist_name", artistNames)
            .single();

          if (fetchError) {
            console.log(`📝 Database query error for "${track.name}":`, {
              code: fetchError.code,
              message: fetchError.message,
              details: fetchError.details,
              hint: fetchError.hint,
            });

            if (fetchError.code !== "PGRST116") {
              // PGRST116 is "not found" error, which is expected for new songs
              console.error(
                `❌ Unexpected error checking track "${track.name}":`,
                fetchError
              );
            }
          }

          if (existingTrack) {
            // Song found in database - add to array with existing mood data
            setLoadingMessage(
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
              predicted_moods: existingTrack.predicted_moods || null, // Already an array from database
            });
            songsInDatabase++;
          } else {
            // Song not found in database - call API for mood analysis
            console.log(
              `🔍 "${track.name}" not found in database - calling API for mood analysis...`
            );

            setLoadingMessage(
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
              const insertData = {
                song_title: track.name,
                artist_name: artistNames,
                song_title_normalised: track.name.toLowerCase(),
                artist_name_normalised: artistNames.toLowerCase(),
                predicted_moods: predictedMoods, // Direct array, not JSON string
                album_name: track.album?.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              console.log("📝 Insert data:", insertData);

              await supabase
                .from("song_mood_analysis")
                .insert(insertData)
                .select();
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

      setLoadingMessage("Creating your timeline...");

      // Call LLM API for timeline analysis
      try {
        console.log("🤖 Calling LLM API for timeline analysis...");

        const moodsDataString = JSON.stringify(moodsAndDataArray);
        console.log(JSON.stringify({ moods_dates_data: moodsDataString }));

        const prompt = `Based on the following chronological list of moods of songs a listener has liked, analyze their emotional journey and create a compelling, music-therapy-style narrative timeline of their musical vibes:

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

* Make sure the number of chapters, phases, contents, and soundtracks all match, phases should only be up to the latest date given in the list above.

Return ONLY valid JSON, following this format/example:
{"Chapters": {"1": "The Echoes of Love and Longing","2": "Embracing the Upbeat","3": "Unveiling Inner Strength"},"Phases": {"1": "(March - April 2018)","2": "(April - July 2018)","3": "(August 2018 - January 2019)"},"Contents": {"1": "You begin in a space of tender reflection, where love's sweetness intertwines with a gentle ache.","2": "The tempo remains elevated, celebrating life's bright moments.","3": "A powerful undercurrent surfaces, marked by anthems of resilience and introspection."},"Soundtracks": {"1": "\\"When I Was Your Man\\" by Bruno Mars","2": "\\"Perfect Strangers\\" by Jonas Blue, JP Cooper","3": "\\"Thunder\\" by Imagine Dragons"}}`;

        console.log(`🤖 LLM API Prompt: ${prompt}`);

        function estimateTokens(text: string): number {
          const normalizedText = text.trim().replace(/\s+/g, ' ');
          const charBasedEstimate = Math.ceil(normalizedText.length / 4);
          return Math.ceil(charBasedEstimate * 1.1);
        }

        const estimatedMaxTokens = Math.ceil(estimateTokens(prompt) * 0.2);

        console.log(`🧮 Max reasoning tokens: ${estimatedMaxTokens}`);

        const llmResponse = await fetch(
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
                  content: [
                    {
                      type: "text",
                      text: prompt,
                    },
                  ],
                },
              ],
              reasoning: {
                // "effort": "low",
                max_tokens: estimatedMaxTokens,
                exclude: true,
              },
            }),
          }
        );

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          let responseText = llmData.choices[0].message.content;
          console.log("🎯 LLM Analysis Result:", responseText);

          // Extract JSON from markdown code blocks if present
          if (responseText.includes("```json")) {
            const jsonMatch = responseText.match(
              /```json\s*(\{[\s\S]*?\})\s*```/
            );
            if (jsonMatch) {
              responseText = jsonMatch[1];
              console.log("📝 Extracted JSON from markdown:", responseText);
            }
          } else if (responseText.includes("```")) {
            // Handle cases where it might just be ``` without json
            const jsonMatch = responseText.match(/```\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
              responseText = jsonMatch[1];
              console.log("📝 Extracted JSON from code block:", responseText);
            }
          }

          // Clean up any remaining backticks or extra whitespace
          responseText = responseText.trim();
          if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```[a-z]*\s*/, "");
          }
          if (responseText.endsWith("```")) {
            responseText = responseText.replace(/\s*```$/, "");
          }

          // Parse the JSON string into an object
          let timelineData;
          try {
            timelineData = JSON.parse(responseText);
            console.log("✅ Successfully parsed timeline data:", timelineData);
          } catch (parseError) {
            console.error("❌ Failed to parse JSON:", parseError);
            console.error("❌ Raw response text:", responseText);
            setError("Failed to process timeline data. Please try again.");
            return;
          }

          setLoadingMessage("Personalized timeline generated!");
          navigate("/moodtimeline", { state: { timeline: timelineData } });
        } else {
          const errorText = await llmResponse.text();
          console.error(
            "❌ LLM API call failed:",
            llmResponse.status,
            errorText
          );
        }
      } catch (llmError) {
        console.error("❌ Error calling LLM API:", llmError);
      }
      // const testText = `{ "Chapters": { "1": "The Whispers of Longing", "2": "The Dawn of Liberation", "3": "The Summer of Sound", "4": "The Autumnal Influx", "5": "The Winter Bloom", "6": "The Spring Awakening", "7": "The Symphony of Self", "8": "The Season of Change" }, "Phases": { "1": "(March 2018)", "2": "(March - April 2018)", "3": "(April - July 2018)", "4": "(August - November 2018)", "5": "(November 2018 - February 2019)", "6": "(March - July 2019)", "7": "(August 2019 - January 2020)", "8": "(February 2020 - Present)" }, "Contents": { "1": "You start with the tender ache of love and memory. A ballad-like introspection guides you through gentle longing and the bittersweet echoes of what was, setting a melancholic yet hopeful tone.", "2": "A shift towards energetic and uplifting sounds ignites a period of uninhibited joy and playful freedom. The music propels you forward, a celebration of fun and the vibrant pulse of life.", "3": "This season bursts with vibrant, upbeat energy. You're immersed in a lively soundscape that encourages movement, celebration, and sharing in communal good times, a pure summer delight.", "4": "A wave of deeper, more introspective rhythms enters your sonic world. Themes of resilience and perseverance emerge, hinting at an internal strength being discovered, a comforting embrace of depth.", "5": "A period of energetic, often danceable tracks signals a shift towards feeling empowered and uplifted. You find yourself drawn to music that makes you feel ready for anything, a confident stride into the unknown.", "6": "The sounds of freedom and self-discovery dominate this phase. Anthems of hope and empowerment fuel your journey, a testament to inner growth and the courage to embrace your personal power.", "7": "A broad spectrum of emotions unfolds, from playful romance to moments of introspection. You explore themes of connection and self-assurance, weaving a tapestry of diverse feelings through your soundtrack.", "8": "The soundscape becomes more grounded and reflective, yet maintains an underlying sense of hope. You navigate through a mix of tender moments and steady optimism, embracing the continuous flow of life's experiences." }, "Soundtracks": { "1": "\\"When I Was Your Man\\" by Bruno Mars", "2": "\\"Lean On\\" by Major Lazer, MØ, DJ Snake", "3": "\\"Perfect Strangers\\" by Jonas Blue, JP Cooper", "4": "\\"Thunder\\" by Imagine Dragons", "5": "\\"Believer\\" by Imagine Dragons", "6": "\\"Youth feat. Khalid\\" by Shawn Mendes, Khalid", "7": "\\"Say You Won't Let Go\\" by James Arthur", "8": "\\"Watermelon Sugar\\" by Harry Styles" } }`
      // navigate('/moodtimeline', {state: { timeline: JSON.parse(testText) }});
    } catch (error) {
      console.error("Error loading Spotify data:", error);
      setError("Failed to load your Spotify data. Please try again.");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      // Handle callback from Spotify
      setLoadingMessage("Authenticating with Spotify...");
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
          setError("Authentication failed. Please try again.");
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
      setIsAnalysisActive(false);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-black relative">
        <div className="absolute inset-0 z-0">
          <Aurora
            colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
            blend={0.5}
            amplitude={0.25}
            speed={1}
          />
        </div>

        <div className="relative z-10 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Oops!</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => {
              setIsAnalysisActive(false);
              navigate("/");
            }}
            className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        {/* Loading Spinner */}
        <div className="mb-8">
          {/* <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white mx-auto"></div> */}
          <Spinner
            className="mx-auto text-stone-50"
            variant="infinite"
            size={64}
          />
        </div>

        {/* User Info */}
        {spotifyUser && (
          <div className="mb-6">
            <h2 className="text-white text-2xl font-bold mb-2">
              👋 Hi there, {spotifyUser.display_name}!
            </h2>
          </div>
        )}

        {/* Loading Message */}
        <p className="text-gray-300 text-lg mb-4">{loadingMessage}</p>

        <p className="text-gray-500 text-sm mt-6">
          This may take a moment depending on your library size...
        </p>
      </div>
    </div>
  );
}
