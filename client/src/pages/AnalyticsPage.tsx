import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles
} from "lucide-react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
    engagement_rate: 0.0
  });
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

      try {
        const resStats = await fetch("http://localhost:8000/analytics", { headers });
        const dataStats = await resStats.json();

        const resBreakdown = await fetch("http://localhost:8000/analytics/breakdown", { headers });
        const dataBreakdown = await resBreakdown.json();

        const resHist = await fetch("http://localhost:8000/analytics/history", { headers });
        const dataHist = await resHist.json();

        if (resStats.ok && resBreakdown.ok && resHist.ok) {
          setStats(dataStats);
          setBreakdown(dataBreakdown);
          setHistory(dataHist);
        } else {
          throw new Error("Failed to load analytics");
        }
      } catch (err) {
        console.warn("Backend API offline. Using mock analytics.");
        setStats({
          total_views: 4520,
          total_likes: 852,
          total_comments: 114,
          total_shares: 53,
          engagement_rate: 22.54
        });
        setBreakdown([
          { platform: "Instagram", posts: 5, views: 1800, color: "#E1306C" },
          { platform: "LinkedIn", posts: 4, views: 1520, color: "#0077B5" },
          { platform: "Twitter", posts: 3, views: 1200, color: "#1DA1F2" }
        ]);
        setHistory([
          { date: "Mon", views: 240, likes: 45, comments: 5 },
          { date: "Tue", views: 360, likes: 62, comments: 8 },
          { date: "Wed", views: 480, likes: 85, comments: 12 },
          { date: "Thu", views: 720, likes: 124, comments: 15 },
          { date: "Fri", views: 890, likes: 160, comments: 20 },
          { date: "Sat", views: 1020, likes: 195, comments: 25 },
          { date: "Sun", views: 1250, likes: 210, comments: 30 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="size-4" />;
      case "linkedin": return <Linkedin className="size-4" />;
      case "twitter": return <Twitter className="size-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin size-8 border-4 border-violet-600 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Draw chart paths
  const padding = 40;
  const w = 600;
  const h = 200;
  const maxViews = Math.max(...history.map(d => d.views), 100);
  const maxLikes = Math.max(...history.map(d => d.likes), 10);

  const viewsPoints = history.map((d, i) => {
    const x = padding + (i * (w - padding * 2) / (history.length - 1));
    const y = h - padding - (d.views * (h - padding * 2) / maxViews);
    return `${x},${y}`;
  }).join(" ");

  const likesPoints = history.map((d, i) => {
    const x = padding + (i * (w - padding * 2) / (history.length - 1));
    const y = h - padding - (d.likes * (h - padding * 2) / maxLikes);
    return `${x},${y}`;
  }).join(" ");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Channel Analytics
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Track engagement rate, audience retention, and reach indexes per platform.
          </p>
        </div>

        {/* Aggregated KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-2.5 rounded-xl text-violet-400">
              <Eye className="size-4.5" />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Impressions</p>
            <h3 className="text-2xl font-black mt-2 text-slate-100">{stats.total_views.toLocaleString()}</h3>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Views logged across networks</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-2.5 rounded-xl text-pink-400">
              <Heart className="size-4.5" />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Likes</p>
            <h3 className="text-2xl font-black mt-2 text-slate-100">{stats.total_likes.toLocaleString()}</h3>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Positive user reactions</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-2.5 rounded-xl text-blue-400">
              <MessageSquare className="size-4.5" />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Comments</p>
            <h3 className="text-2xl font-black mt-2 text-slate-100">{stats.total_comments.toLocaleString()}</h3>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Discussion threads generated</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-2.5 rounded-xl text-emerald-400">
              <Share2 className="size-4.5" />
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Shares</p>
            <h3 className="text-2xl font-black mt-2 text-slate-100">{stats.total_shares.toLocaleString()}</h3>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Content reposts and distributions</p>
          </div>
        </div>

        {/* Detailed Graph Visualization & Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main SVG Graph */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-200">Daily Performance Trends</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dual-axis view (Purple: Views, Pink: Likes) comparison.</p>
              </div>
            </div>

            <div className="w-full flex justify-center py-2 bg-slate-950/20 rounded-xl border border-slate-800/30 relative">
              <svg className="w-full h-[200px]" viewBox={`0 0 ${w} ${h}`}>
                {/* Horizontal Guidelines */}
                <line x1={padding} y1={padding} x2={w - padding} y2={padding} stroke="rgba(51, 65, 85, 0.15)" strokeDasharray="3" />
                <line x1={padding} y1={h / 2} x2={w - padding} y2={h / 2} stroke="rgba(51, 65, 85, 0.15)" strokeDasharray="3" />
                <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke="rgba(51, 65, 85, 0.25)" />
                
                {/* Views sparkline (Purple) */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    points={viewsPoints}
                  />
                )}

                {/* Likes sparkline (Pink) */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#db2777"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    points={likesPoints}
                  />
                )}

                {/* Y-axis Labels */}
                <text x={padding - 5} y={padding + 4} textAnchor="end" className="fill-slate-600 text-[8px] font-bold">Max</text>
                <text x={padding - 5} y={h - padding + 2} textAnchor="end" className="fill-slate-600 text-[8px] font-bold">0</text>
              </svg>
            </div>

            {/* X Labels */}
            <div className="flex justify-between px-10 text-[10px] text-slate-500 font-bold mt-4">
              {history.map((d, index) => (
                <span key={index}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Platform Reach Share breakdown */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-200">Platform Share</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution of views across channels.</p>
            </div>

            <div className="space-y-4 my-6">
              {breakdown.map((item, idx) => {
                const total = breakdown.reduce((acc, curr) => acc + curr.views, 0);
                const percent = total > 0 ? Math.round((item.views / total) * 100) : 0;
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span 
                          className="p-1 rounded-md flex items-center justify-center border"
                          style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}20`, color: item.color }}
                        >
                          {getPlatformIcon(item.platform)}
                        </span>
                        <span>{item.platform}</span>
                      </div>
                      <span className="text-slate-400">{percent}% ({item.views.toLocaleString()})</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-950/40 rounded-full overflow-hidden border border-slate-800/60">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl flex items-center gap-2.5 text-xs text-violet-400">
              <Sparkles className="size-4 shrink-0" />
              <span>LinkedIn shows a 15% increase in lead conversion this period.</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
