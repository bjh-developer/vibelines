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
import TimelineChart from "../components/TimelineChart";
// import { useLiked } from "../hooks/useLiked";
// import { SimpleTrack } from "../api/types";

export default function LikedSongsPage() {
    // const { data } = useLiked();
    return (
        <div className="p-4">
            {/* <h1 className="text-xl font-bold mb-4">Your Liked Songs</h1>
            <ul className="space-y-1">
                {data!.map((t: SimpleTrack) => (
                <li key={t.id}>{t.name} – {t.artists} - {t.added_at}</li>
                ))}
            </ul> */}
            <h1 className="text-xl font-bold mb-4">Your Mood Timeline</h1>
            <TimelineChart />
        </div>
    
    );
}
