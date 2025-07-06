// import { useLiked } from "../hooks/useLiked";
// import Spinner from "../components/Spinner";
// import { SimpleTrack } from "../api/types";

// const LikedSongsPage: React.FC = () => {
//   const { data, isLoading, error } = useLiked();

//   if (isLoading) return <Spinner />;
//   if (error)     return <p>Error: {`${error}`}</p>;

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-bold mb-4">Your Liked Songs</h1>
//       <ul className="space-y-1">
//         {data!.map((t: SimpleTrack) => (
//         <li key={t.id}>{t.name} – {t.artists} - {t.added_at}</li>
//         ))}
//       </ul>
//     </div>
//   );

// };

// export default LikedSongsPage;
import AdvancedTimelineChart from "../components/AdvancedTimelineChart";
// import { useLiked } from "../hooks/useLiked";
// import { SimpleTrack } from "../api/types";

export default function LikedSongsPage() {
    // const { data } = useLiked();
    return (
        <div className="p-4 space-y-8">
            <h1 className="text-2xl font-bold mb-6">Your Mood Timeline</h1>
            
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-700">🚀 Production-Ready Implementation</h2>
                    <AdvancedTimelineChart />
                </div>
            </div>
        </div>
    );
}
