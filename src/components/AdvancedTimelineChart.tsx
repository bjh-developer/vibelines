import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useAdvancedMood } from "../hooks/useAdvancedMood";
import type { MoodPoint } from "../services/sentimentService";

function formatWeekLabel(week: string) {
  const [y, m, d] = week.split("-");
  return `${d} ${new Date(`${y}-${m}-01`).toLocaleString("default", {
    month: "short",
  })} ${y}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const AdvancedTimelineChart: React.FC = () => {
  const { 
    data, 
    isProcessing, 
    error, 
    progress,
    clearCache,
    getCacheStats,
    exportCache,
    importCache,
    getStorageInfo,
    checkGeniusHealth
  } = useAdvancedMood();

  const [viewMode, setViewMode] = useState<'valence_energy' | 'emotions'>('valence_energy');
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [geniusHealth, setGeniusHealth] = useState<boolean | null>(null);

  const handleShowCacheInfo = async () => {
    const stats = await getCacheStats();
    const storage = await getStorageInfo();
    const health = await checkGeniusHealth();
    
    setCacheStats(stats);
    setStorageInfo(storage);
    setGeniusHealth(health);
    setShowCacheInfo(true);
  };

  const handleClearCache = async () => {
    await clearCache();
    setShowCacheInfo(false);
    window.location.reload(); // Refresh to show updated data
  };

  const handleExportCache = async () => {
    const data = await exportCache();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibelines-cache-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCache = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const success = await importCache(text);
    
    if (success) {
      alert('Cache imported successfully!');
      window.location.reload();
    } else {
      alert('Failed to import cache. Please check the file format.');
    }
  };

  if (isProcessing) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">
          🧠 Advanced Sentiment Analysis in Progress
        </h3>
        
        {progress && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-blue-600">
              <span>Stage: {progress.stage.replace('_', ' ').toUpperCase()}</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            
            {progress.currentTrack && (
              <p className="text-sm text-blue-700">
                Processing: {progress.currentTrack}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {`${error}`}</p>
      </div>
    );
  }

  if (!data?.timeline.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No mood data available yet.</p>
      </div>
    );
  }

  const series: MoodPoint[] = [...data.timeline].sort((a, b) =>
    a.week.localeCompare(b.week)
  );

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              🚀 Production-Ready Sentiment Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-purple-600 font-medium">Tracks:</span>
                <span className="ml-1">{data.processingStats.totalTracks}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Cached:</span>
                <span className="ml-1">{data.processingStats.cachedSentiment}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">New Analysis:</span>
                <span className="ml-1">{data.processingStats.newAnalysis}</span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Processing Time:</span>
                <span className="ml-1">{(data.processingStats.processingTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'valence_energy' ? 'emotions' : 'valence_energy')}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              {viewMode === 'valence_energy' ? 'Show Emotions' : 'Show Valence/Energy'}
            </button>
            <button
              onClick={handleShowCacheInfo}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Cache Info
            </button>
          </div>
        </div>
      </div>

      {/* Cache Information Modal */}
      {showCacheInfo && cacheStats && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Cache & System Information</h4>
            <button
              onClick={() => setShowCacheInfo(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Cache Statistics</h5>
              <ul className="space-y-1">
                <li>Hit Rate: {(cacheStats.hitRate * 100).toFixed(1)}%</li>
                <li>Total Size: {formatBytes(cacheStats.totalSize)}</li>
                <li>Entries: {cacheStats.entryCount}</li>
                <li>Lyrics Cached: {cacheStats.lyricsCount}</li>
                <li>Sentiment Cached: {cacheStats.sentimentCount}</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">System Status</h5>
              <ul className="space-y-1">
                <li>Genius API: {geniusHealth ? '✅ Healthy' : '❌ Unavailable'}</li>
                <li>Storage Available: {storageInfo?.available ? '✅ Yes' : '❌ No'}</li>
                {storageInfo?.quota && (
                  <li>Storage Usage: {(storageInfo.percentage || 0).toFixed(1)}%</li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <button
              onClick={handleExportCache}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Export Cache
            </button>
            <label className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer">
              Import Cache
              <input
                type="file"
                accept=".json"
                onChange={handleImportCache}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {viewMode === 'valence_energy' ? (
          <LineChart data={series} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fontSize: 12 }}
              label={{ value: "Mood score", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(v: number) => v.toFixed(3)}
              labelFormatter={formatWeekLabel}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="valence"
              name="Valence (happy ↔ sad)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={series} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
              label={{ value: "Emotion intensity", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(v: number) => v.toFixed(3)}
              labelFormatter={formatWeekLabel}
            />
            <Legend verticalAlign="top" height={36} />
            <Area
              type="monotone"
              dataKey="emotions.joy"
              stackId="1"
              stroke="#fbbf24"
              fill="#fbbf24"
              name="Joy"
            />
            <Area
              type="monotone"
              dataKey="emotions.sadness"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              name="Sadness"
            />
            <Area
              type="monotone"
              dataKey="emotions.anger"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              name="Anger"
            />
            <Area
              type="monotone"
              dataKey="emotions.fear"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              name="Fear"
            />
            <Area
              type="monotone"
              dataKey="emotions.surprise"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Surprise"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Track Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Recent Analysis Results</h4>
        <div className="max-h-40 overflow-y-auto">
          {data.tracks.slice(0, 5).map(track => (
            <div key={track.id} className="text-sm py-1 border-b border-gray-200 last:border-b-0">
              <span className="font-medium">{track.name}</span> - {track.artists}
              <div className="text-gray-600 text-xs">
                Valence: {track.sentiment.valence.toFixed(2)}, 
                Energy: {track.sentiment.energy.toFixed(2)}, 
                Language: {track.sentiment.language}, 
                Confidence: {(track.sentiment.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTimelineChart;

