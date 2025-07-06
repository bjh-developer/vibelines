/// <reference types="spotify-api" />
// Alternatively:  import type { UsersSavedTracksResponse, SavedTrackObject, ArtistObjectSimplified } from "spotify-api";

import { SimpleTrack } from "./types";

/**
 * Fetches ALL liked songs (up to 10 000) via Spotify Web API.
 * Follows the paging 'next' URL automatically.
 */
// export async function fetchAllLikedTracks(
//   accessToken: string,
//   abortSignal?: AbortSignal
// ): Promise<SimpleTrack[]> {
//   const headers = { Authorization: `Bearer ${accessToken}` };
//   let url: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
//   const all: SimpleTrack[] = [];

//   while (url) {
//     const res = await fetch(url, { headers, signal: abortSignal });
//     if (!res.ok) throw new Error(`Spotify error ${res.status}`);

//     // ---- type the whole page ----
//     const page = (await res.json()) as SpotifyApi.UsersSavedTracksResponse;

//     // ---- type each item explicitly ----
//     page.items.forEach((item: SpotifyApi.SavedTrackObject) => {
//       const { added_at, track } = item;
//       all.push({
//         id: track.id,
//         name: track.name,
//         artists: track.artists
//           .map((a: SpotifyApi.ArtistObjectSimplified) => a.name)
//           .join(", "),
//         added_at,
//       });
//     });

//     url = page.next ?? null;   // next is null when no more pages
//   }

//   return all;
// }

export async function fetchAllLikedTracks(
  accessToken: string,
  abortSignal?: AbortSignal
): Promise<SimpleTrack[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  let url: string | null = "https://api.spotify.com/v1/me/tracks?limit=20";
  const all: SimpleTrack[] = [];

  while (url && all.length < 20) {
    // ...existing code...
    const res = await fetch(url, { headers, signal: abortSignal });
    if (!res.ok) throw new Error(`Spotify error ${res.status}`);

    const page = (await res.json()) as SpotifyApi.UsersSavedTracksResponse;

    // ...existing code...
    for (const item of page.items) {
      if (all.length >= 20) break;
      const { added_at, track } = item;
      all.push({
        id: track.id,
        name: track.name,
        artists: track.artists
          .map((a) => a.name)
          .join(", "),
        added_at,
      });
    }

    // ...existing code...
    url = page.next ?? null;
  }

  return all;
}
