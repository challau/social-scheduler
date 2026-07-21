import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  TrendingUp, 
  Plus, 
  ArrowUpRight
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_posts: 0,
    scheduled_posts: 0,
    published_posts: 0,
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
    engagement_rate: 0.0
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      try {
        // Fetch analytics overview
        const resStats = await fetch("http://localhost:8000/analytics", { headers });
        const dataStats = await resStats.json();
        
        // Fetch recent posts
        const resPosts = await fetch("http://localhost:8000/posts", { headers });
        const dataPosts = await resPosts.json();

        // Fetch connected accounts
        const resAcc = await fetch("http://localhost:8000/oauth/accounts", { headers });
        const dataAcc = await resAcc.json();

        // Fetch history for graph
        const resHist = await fetch("http://localhost:8000/analytics/history", { headers });
        const dataHist = await resHist.json();

        if (resStats.ok && resPosts.ok) {
          setStats(dataStats);
          setPosts(dataPosts.slice(0, 4)); // Get top 4 recent
          setAccounts(dataAcc);
          setHistory(dataHist);
        } else {
          throw new Error("API responded with error");
        }
      } catch (err) {
        console.warn("Backend API offline or returned error. Falling back to dashboard mockup data.");
        // Seed mock data for stand-alone frontend usage
        setStats({
          total_posts: 12,
          scheduled_posts: 4,
          published_posts: 8,
          total_views: 4520,
          total_likes: 852,
          total_comments: 114,
          total_shares: 53,
          engagement_rate: 22.54
        });
        setPosts([
          {
            id: 1,
            content: "Excited to participation in the tech hackathon building SaaS projects! 🚀💻",
            status: "published",
            media_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=300",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            analytics: { views: 1250, likes: 210, comments: 24, shares: 12 }
          },
          {
            id: 2,
            content: "Streamlining operations through AI-powered content scheduling systems. Here is how: #Productivity",
            status: "scheduled",
            scheduled_time: new Date(Date.now() + 3600000 * 24).toISOString(),
            created_at: new Date(Date.now() - 3600000 * 18).toISOString()
          },
          {
            id: 3,
            content: "Consistent output is the main driver of brand amplification. Build systems, not goals.",
            status: "published",
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            analytics: { views: 820, likes: 115, comments: 18, shares: 5 }
          }
        ]);
        setAccounts([
          { platform: "linkedin", username: "SocialFlow AI Creator" },
          { platform: "twitter", username: "SocialFlowAI" }
        ]);
        setHistory([
          { date: "Mon", views: 240, likes: 45 },
          { date: "Tue", views: 360, likes: 62 },
          { date: "Wed", views: 480, likes: 85 },
          { date: "Thu", views: 720, likes: 124 },
          { date: "Fri", views: 890, likes: 160 },
          { date: "Sat", views: 1020, likes: 195 },
          { date: "Sun", views: 1250, likes: 210 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="size-4 text-pink-500" />;
      case "linkedin": return <Linkedin className="size-4 text-blue-500" />;
      case "twitter": return <Twitter className="size-4 text-sky-400" />;
      default: return <Share2 className="size-4 text-slate-400" />;
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

  // Calculate coordinates for simple SVG line chart
  const padding = 40;
  const graphWidth = 500;
  const graphHeight = 150;
  const maxVal = Math.max(...history.map(d => d.views), 100);
  
  const points = history.map((d, index) => {
    const x = padding + (index * (graphWidth - padding * 2) / (history.length - 1));
    const y = graphHeight - padding - (d.views * (graphHeight - padding * 2) / maxVal);
    return `${x},${y}`;
  }).join(" ");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Monitor your cross-platform automation and recent engagement rates.
            </p>
          </div>
          <Link 
            to="/create" 
            className="self-start md:self-auto flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl text-sm transition-all duration-300 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-98"
          >
            <Plus className="size-4.5" />
            Create Post
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Posts */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-3 rounded-xl">
              <FileText className="size-5 text-violet-400" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Posts</p>
            <h3 className="text-3xl font-black mt-2 text-slate-100">{stats.total_posts}</h3>
            <p className="text-slate-400 text-xs mt-3 flex items-center gap-1">
              Campaigns compiled
            </p>
          </div>

          {/* Scheduled Posts */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-3 rounded-xl">
              <Calendar className="size-5 text-amber-400" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Scheduled</p>
            <h3 className="text-3xl font-black mt-2 text-slate-100">{stats.scheduled_posts}</h3>
            <p className="text-slate-400 text-xs mt-3 flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-amber-500 animate-pulse" /> Pending publishing
            </p>
          </div>

          {/* Published Posts */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-3 rounded-xl">
              <CheckCircle2 className="size-5 text-emerald-400" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Published</p>
            <h3 className="text-3xl font-black mt-2 text-slate-100">{stats.published_posts}</h3>
            <p className="text-slate-400 text-xs mt-3 flex items-center gap-1">
              Successfully distributed
            </p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
            <div className="absolute right-4 top-4 bg-slate-800/40 border border-slate-700/20 p-3 rounded-xl">
              <TrendingUp className="size-5 text-fuchsia-400" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Engagement Rate</p>
            <h3 className="text-3xl font-black mt-2 text-slate-100">{stats.engagement_rate}%</h3>
            <p className="text-emerald-400 text-xs mt-3 flex items-center gap-1">
              Avg content response rate
            </p>
          </div>
        </div>

        {/* Channels & Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analytics Line Chart */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-200">Views & Reach Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Reach metric tracking over last 7 active periods.</p>
              </div>
              <Link to="/analytics" className="text-xs text-violet-400 flex items-center gap-1 hover:underline">
                Full Report <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {/* Sparkline chart */}
            <div className="w-full flex justify-center py-2 bg-slate-950/20 rounded-xl border border-slate-800/30">
              <svg className="w-full h-[150px]" viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(124, 58, 237)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                <line x1={padding} y1={padding} x2={graphWidth - padding} y2={padding} stroke="rgba(51, 65, 85, 0.15)" strokeDasharray="3" />
                <line x1={padding} y1={graphHeight - padding} x2={graphWidth - padding} y2={graphHeight - padding} stroke="rgba(51, 65, 85, 0.25)" />
                
                {/* Fill Area */}
                {history.length > 1 && (
                  <path
                    d={`M ${padding},${graphHeight - padding} L ${points} L ${graphWidth - padding},${graphHeight - padding} Z`}
                    fill="url(#chartGradient)"
                  />
                )}

                {/* Line Path */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3.5"
                    points={points}
                  />
                )}
                
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#db2777" />
                </linearGradient>

                {/* Dots on points */}
                {history.map((d, index) => {
                  const x = padding + (index * (graphWidth - padding * 2) / (history.length - 1));
                  const y = graphHeight - padding - (d.views * (graphHeight - padding * 2) / maxVal);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-fuchsia-500 stroke-slate-950 stroke-2 cursor-pointer hover:r-5 transition-all"
                    />
                  );
                })}
              </svg>
            </div>
            
            {/* Chart X Labels */}
            <div className="flex justify-between px-10 text-[10px] text-slate-500 font-medium mt-3">
              {history.map((d, index) => (
                <span key={index}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Social Channels Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-200">Connected Channels</h3>
              <p className="text-xs text-slate-500 mt-0.5">Linked publishing endpoints.</p>
            </div>

            <div className="space-y-4">
              {/* Instagram */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <Instagram className="size-4.5 text-pink-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">Instagram Business</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {accounts.find(a => a.platform === "instagram")?.username || "Not connected"}
                    </p>
                  </div>
                </div>
                <span className={`inline-block size-2 rounded-full ${accounts.some(a => a.platform === "instagram") ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-700"}`} />
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Linkedin className="size-4.5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">LinkedIn Profile</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {accounts.find(a => a.platform === "linkedin")?.username || "Not connected"}
                    </p>
                  </div>
                </div>
                <span className={`inline-block size-2 rounded-full ${accounts.some(a => a.platform === "linkedin") ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-700"}`} />
              </div>

              {/* Twitter */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
                    <Twitter className="size-4.5 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">Twitter/X Channel</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {accounts.find(a => a.platform === "twitter")?.username || "Not connected"}
                    </p>
                  </div>
                </div>
                <span className={`inline-block size-2 rounded-full ${accounts.some(a => a.platform === "twitter") ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-700"}`} />
              </div>
            </div>

            <Link 
              to="/settings" 
              className="block text-center py-2.5 text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700/60 hover:bg-slate-800/10 rounded-xl transition-all duration-300"
            >
              Manage accounts
            </Link>
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-200">Recent Post Actions</h3>
            <Link to="/calendar" className="text-xs text-violet-400 flex items-center gap-1 hover:underline">
              View Calendar <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl text-slate-500 text-sm">
                No recent campaigns. Create a new campaign to begin.
              </div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl hover:border-slate-700/40 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    {post.media_url ? (
                      <img 
                        src={post.media_url} 
                        alt="Content Preview" 
                        className="size-14 rounded-lg object-cover border border-slate-800"
                      />
                    ) : (
                      <div className="size-14 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-center">
                        <FileText className="size-5 text-slate-500" />
                      </div>
                    )}
                    <div className="space-y-1.5 max-w-lg">
                      <p className="text-sm text-slate-300 line-clamp-2 pr-4">{post.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Platform indicators */}
                        {post.ai_generations ? (
                          post.ai_generations.map((gen: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 text-[10px] text-slate-400 border border-slate-700/20">
                              {getPlatformIcon(gen.platform)}
                              <span className="capitalize">{gen.platform}</span>
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 text-[10px] text-slate-400 border border-slate-700/20">
                            {getPlatformIcon("generic")}
                            <span>Simulated Platform</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-slate-800/40 sm:border-t-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${post.status === "published" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}
                      ${post.status === "scheduled" && "bg-amber-500/10 text-amber-400 border border-amber-500/20"}
                      ${post.status === "draft" && "bg-slate-800 text-slate-400 border border-slate-700"}
                    `}>
                      <span className={`size-1.5 rounded-full 
                        ${post.status === "published" && "bg-emerald-500"}
                        ${post.status === "scheduled" && "bg-amber-500 animate-pulse"}
                        ${post.status === "draft" && "bg-slate-500"}
                      `} />
                      <span className="capitalize text-[10px] tracking-wider uppercase">{post.status}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-1">
                      {post.status === "published" 
                        ? `Published ${new Date(post.created_at).toLocaleDateString()}`
                        : `Run on ${new Date(post.scheduled_time || post.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
