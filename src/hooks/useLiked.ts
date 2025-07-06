import { useQuery } from "@tanstack/react-query";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { fetchAllLikedTracks } from "../api/fetchLiked";

export function useLiked() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["liked", token],
    queryFn: ({ signal }: QueryFunctionContext) => fetchAllLikedTracks(token!, signal),
    enabled: !!token,
    staleTime: 1000 * 60 * 10,
  });
}
