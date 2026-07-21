import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { API_URL } from "../config";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  X
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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

      try {
        const res = await fetch(`${API_URL}/posts`, { headers });
        const data = await res.json();
        
        if (res.ok) {
          // Filter only scheduled or published posts with scheduled times
          const filtered = data.filter((p: any) => p.scheduled_time);
          setScheduledPosts(filtered);
        } else {
          throw new Error("Failed to fetch posts");
        }
      } catch (err) {
        console.warn("Backend API offline. Seeding calendar with mock posts.");
        // Seed mock posts spread out over the current month
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        setScheduledPosts([
          {
            id: 101,
            content: "Participating in the annual technology hackathon! Building future automation tools. 💻🚀",
            status: "published",
            media_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=300",
            scheduled_time: new Date(year, month, today.getDate() - 3, 14, 0).toISOString(),
            ai_generations: [{ platform: "linkedin" }, { platform: "twitter" }]
          },
          {
            id: 102,
            content: "How content scheduling systems prevent creator burnout. Tips inside! #Marketing",
            status: "scheduled",
            scheduled_time: new Date(year, month, today.getDate() + 2, 10, 30).toISOString(),
            ai_generations: [{ platform: "instagram" }, { platform: "linkedin" }]
          },
          {
            id: 103,
            content: "Habits compound. Code daily, publish consistently, build systems. #Developer",
            status: "scheduled",
            scheduled_time: new Date(year, month, today.getDate() + 5, 17, 15).toISOString(),
            ai_generations: [{ platform: "twitter" }]
          },
          {
            id: 104,
            content: "Announcing SocialFlow AI official release! Automate cross-posting now.",
            status: "scheduled",
            scheduled_time: new Date(year, month, today.getDate() + 9, 9, 0).toISOString(),
            ai_generations: [{ platform: "instagram" }, { platform: "linkedin" }, { platform: "twitter" }]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="size-3 text-pink-500" />;
      case "linkedin": return <Linkedin className="size-3 text-blue-500" />;
      case "twitter": return <Twitter className="size-3 text-sky-400" />;
      default: return null;
    }
  };

  // Helper calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayDate = new Date(year, month + 1, 0).getDate();

  const prevLastDayDate = new Date(year, month, 0).getDate();

  const daysArr = [];

  // Add padding days from previous month
  for (let i = firstDayIndex; i > 0; i--) {
    daysArr.push({
      dayNum: prevLastDayDate - i + 1,
      currentMonth: false,
      dateObj: new Date(year, month - 1, prevLastDayDate - i + 1)
    });
  }

  // Add days of current month
  for (let i = 1; i <= lastDayDate; i++) {
    daysArr.push({
      dayNum: i,
      currentMonth: true,
      dateObj: new Date(year, month, i)
    });
  }

  // Add padding days for next month to complete grid
  const totalGridCells = 42;
  const nextMonthPadding = totalGridCells - daysArr.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    daysArr.push({
      dayNum: i,
      currentMonth: false,
      dateObj: new Date(year, month + 1, i)
    });
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = direction === "prev" ? month - 1 : month + 1;
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const getPostsForDay = (date: Date) => {
    return scheduledPosts.filter(post => {
      const pDate = new Date(post.scheduled_time);
      return pDate.getDate() === date.getDate() &&
             pDate.getMonth() === date.getMonth() &&
             pDate.getFullYear() === date.getFullYear();
    });
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Content Calendar
            </h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Track and reschedule your upcoming social media publishes visually.
            </p>
          </div>

          {/* Calendar month switcher controls */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-xl">
            <button 
              onClick={() => navigateMonth("prev")} 
              className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold text-slate-200 px-2 min-w-32 text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={() => navigateMonth("next")} 
              className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-800/80 bg-slate-950/20 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Monthly Days Cells */}
          <div className="grid grid-cols-7 md:grid-rows-6 min-h-[450px]">
            {daysArr.map((cell, idx) => {
              const dayPosts = getPostsForDay(cell.dateObj);
              const isToday = new Date().toDateString() === cell.dateObj.toDateString();
              
              return (
                <div 
                  key={idx} 
                  className={`
                    border-r border-b border-slate-800/40 p-2 flex flex-col justify-between min-h-16 md:min-h-24 hover:bg-slate-800/10 transition-colors
                    ${!cell.currentMonth && "opacity-30 bg-slate-950/10"}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-xs font-bold leading-none size-6 flex items-center justify-center rounded-lg
                      ${isToday ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-400"}
                    `}>
                      {cell.dayNum}
                    </span>
                  </div>

                  {/* Day posts container */}
                  <div className="space-y-1.5 mt-2 flex-1 flex flex-col justify-end overflow-hidden">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`
                          w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-left truncate transition-all duration-200 border
                          ${post.status === "published"
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-400/90"
                            : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 text-amber-400/90"}
                        `}
                      >
                        <span className="text-[10px] font-semibold truncate flex-1 leading-tight">
                          {post.content}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {post.ai_generations?.map((gen: any, gIdx: number) => (
                            <span key={gIdx} className="opacity-80">
                              {getPlatformIcon(gen.platform)}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Post Preview Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border
                    ${selectedPost.status === "published" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}
                  >
                    {selectedPost.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(selectedPost.scheduled_time).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-200 text-sm leading-relaxed pr-2">
                    {selectedPost.content}
                  </p>
                  {selectedPost.media_url && (
                    <img 
                      src={selectedPost.media_url} 
                      alt="Campaign Media" 
                      className="w-full h-48 object-cover rounded-xl border border-slate-800 mt-3"
                    />
                  )}
                </div>

                {/* Previews tailored targets */}
                {selectedPost.ai_generations && (
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Generated platform drafts</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedPost.ai_generations.map((gen: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold capitalize text-slate-300">
                            {getPlatformIcon(gen.platform)}
                            {gen.platform} copy
                          </div>
                          <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                            {gen.caption || selectedPost.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
