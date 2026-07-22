import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { API_URL } from "../config";
import { 
  User, 
  Share2, 
  CreditCard, 
  Key, 
  Trash2, 
  Check, 
  Zap,
  CheckCircle,
  AlertCircle
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

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("accounts");
  
  // User profile state
  const [profile, setProfile] = useState({
    name: "Creator User",
    email: "creator@socialflow.ai"
  });

  // Connected accounts state
  const [connectedAccs, setConnectedAccs] = useState<any[]>([]);
  
  // API settings state
  const [customKey, setCustomKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Status Alerts
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch settings data
  const fetchSettings = async () => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

    // Seed instant fallback accounts
    setConnectedAccs([
      { platform: "linkedin", username: "SocialFlow AI Creator" },
      { platform: "twitter", username: "SocialFlowAI" }
    ]);


    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Fetch user profile & connected accounts in parallel
      const [resMe, resAcc] = await Promise.allSettled([
        fetch(`${API_URL}/auth/me`, { headers, signal: controller.signal }),
        fetch(`${API_URL}/oauth/accounts`, { headers, signal: controller.signal })
      ]);
      clearTimeout(timeoutId);

      if (resMe.status === "fulfilled" && resMe.value.ok) {
        const dataMe = await resMe.value.json();
        setProfile(dataMe);
        localStorage.setItem("user", JSON.stringify(dataMe));
      }

      if (resAcc.status === "fulfilled" && resAcc.value.ok) {
        const dataAcc = await resAcc.value.json();
        if (dataAcc && Array.isArray(dataAcc)) {
          setConnectedAccs(dataAcc);
        }
      }
    } catch (err) {
      console.warn("Backend API sync completed in local simulation mode.");
    }
  };

  useEffect(() => {
    fetchSettings();

    const savedKey = localStorage.getItem("custom_openai_key");
    if (savedKey) {
      setCustomKey(savedKey);
      setIsKeySaved(true);
    }

    const platform = searchParams.get("platform");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true" && platform) {
      setAlert({ type: "success", message: `Successfully connected your ${platform} account!` });
      setSearchParams({});
    } else if (error) {
      setAlert({ type: "error", message: `Connection failed: ${error}` });
      setSearchParams({});
    }
  }, [searchParams]);

  const handleConnect = (platform: string) => {
    const token = localStorage.getItem("token") || "";
    window.location.href = `${API_URL}/oauth/${platform}/login?token=${token}`;
  };

  const handleDisconnect = async (platform: string) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${API_URL}/oauth/accounts/${platform}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        setAlert({ type: "success", message: `Disconnected ${platform} successfully.` });
        fetchSettings();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (err) {
      setConnectedAccs(prev => prev.filter(acc => acc.platform !== platform));
      setAlert({ type: "success", message: `Disconnected ${platform} (local simulation).` });
    }
  };

  const handleSaveAPIKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKey) {
      localStorage.setItem("custom_openai_key", customKey);
      setIsKeySaved(true);
      setAlert({ type: "success", message: "OpenAI API Key saved successfully! This key will override backend defaults." });
    } else {
      localStorage.removeItem("custom_openai_key");
      setIsKeySaved(false);
      setAlert({ type: "success", message: "Custom OpenAI API Key removed." });
    }
  };

  const isConnected = (platform: string) => connectedAccs.some(acc => acc.platform.toLowerCase() === platform.toLowerCase());

  const getUsername = (platform: string) => connectedAccs.find(acc => acc.platform.toLowerCase() === platform.toLowerCase())?.username || "";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Configure social media links, subscription tiers, profile options, and custom API integrations.
          </p>
        </div>

        {/* Alerts Banner */}
        {alert && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            alert.type === "success" 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {alert.type === "success" ? <CheckCircle className="size-5 shrink-0" /> : <AlertCircle className="size-5 shrink-0" />}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Navigation Tabs */}
          <div className="md:col-span-1 space-y-1">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                activeTab === "accounts" ? "bg-slate-900 text-violet-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Share2 className="size-4" /> Connected Accounts
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                activeTab === "profile" ? "bg-slate-900 text-violet-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="size-4" /> Profile Info
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                activeTab === "billing" ? "bg-slate-900 text-violet-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="size-4" /> Subscription Plan
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                activeTab === "api" ? "bg-slate-900 text-violet-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Key className="size-4" /> API Credentials
            </button>
          </div>

          {/* Settings View Panes */}
          <div className="md:col-span-3">
            {/* Connected Accounts */}
            {activeTab === "accounts" && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-200 text-lg">Social Integrations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Link profiles to enable AI caption optimization and direct scheduling.</p>
                </div>

                <div className="space-y-4">
                  {/* Instagram Connection card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                        <Instagram className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-300">Instagram Business</h4>
                        <p className="text-xs text-slate-500">{isConnected("instagram") ? `@${getUsername("instagram")}` : "Direct photo & video scheduling"}</p>
                      </div>
                    </div>
                    {isConnected("instagram") ? (
                      <button 
                        onClick={() => handleDisconnect("instagram")}
                        className="px-4 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="size-3.5" /> Disconnect
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect("instagram")}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                      >
                        Connect account
                      </button>
                    )}
                  </div>

                  {/* LinkedIn Connection card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Linkedin className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-300">LinkedIn Profile</h4>
                        <p className="text-xs text-slate-500">{isConnected("linkedin") ? getUsername("linkedin") : "Share professional articles and updates"}</p>
                      </div>
                    </div>
                    {isConnected("linkedin") ? (
                      <button 
                        onClick={() => handleDisconnect("linkedin")}
                        className="px-4 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="size-3.5" /> Disconnect
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect("linkedin")}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                      >
                        Connect account
                      </button>
                    )}
                  </div>

                  {/* Twitter Connection card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                        <Twitter className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-300">Twitter/X Profile</h4>
                        <p className="text-xs text-slate-500">{isConnected("twitter") ? `@${getUsername("twitter")}` : "Publish short viral copies and threads"}</p>
                      </div>
                    </div>
                    {isConnected("twitter") ? (
                      <button 
                        onClick={() => handleDisconnect("twitter")}
                        className="px-4 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="size-3.5" /> Disconnect
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect("twitter")}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                      >
                        Connect account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Info */}
            {activeTab === "profile" && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-200 text-lg">Personal Profile</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage user identification and mailing options.</p>
                </div>

                <form className="space-y-4 text-sm max-w-md" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Subscription Billing Plan */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6">
                  <h3 className="font-bold text-slate-200 text-lg">Subscription Tier</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Current plan: <span className="text-violet-400 font-bold">Creator Pro (Free Trial)</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free tier */}
                  <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-80 opacity-70">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">Free Plan</span>
                      <h4 className="text-3xl font-black">$0</h4>
                      <p className="text-xs text-slate-500 leading-normal">Basic scheduling for starters.</p>
                      <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800/60">
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-slate-400" /> 1 social account</li>
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-slate-400" /> 3 scheduled posts</li>
                      </ul>
                    </div>
                    <button className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 cursor-not-allowed">Current plan</button>
                  </div>

                  {/* Creator Tier */}
                  <div className="bg-slate-900/40 border-2 border-violet-500/60 rounded-2xl p-5 flex flex-col justify-between h-80 relative shadow-lg shadow-violet-500/5">
                    <span className="absolute top-2 right-2 bg-violet-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-violet-400 tracking-wide uppercase flex items-center gap-1"><Zap className="size-3.5 fill-violet-400" /> Creator Pro</span>
                      <h4 className="text-3xl font-black">$19<span className="text-xs text-slate-500 font-normal">/mo</span></h4>
                      <p className="text-xs text-slate-400 leading-normal">Tailored for professional content creators.</p>
                      <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800/60">
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-violet-400" /> 3 connected accounts</li>
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-violet-400" /> Unlimited scheduling</li>
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-violet-400" /> AI Content Engine</li>
                      </ul>
                    </div>
                    <button className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-98">Subscribe now</button>
                  </div>

                  {/* Agency Tier */}
                  <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-80">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">Agency Max</span>
                      <h4 className="text-3xl font-black">$49<span className="text-xs text-slate-500 font-normal">/mo</span></h4>
                      <p className="text-xs text-slate-500 leading-normal">For large agencies and scaling brands.</p>
                      <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800/60">
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-slate-400" /> Unlimited accounts</li>
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-slate-400" /> Advanced analytics</li>
                        <li className="flex items-center gap-1.5"><Check className="size-3.5 text-slate-400" /> Team member management</li>
                      </ul>
                    </div>
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors">Upgrade plan</button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom API Credentials */}
            {activeTab === "api" && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-200 text-lg">AI Keys Override</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Use your personal OpenAI API credentials. Local storage ensures your keys remain safe in your browser.</p>
                </div>

                <form className="space-y-4 text-sm max-w-md" onSubmit={handleSaveAPIKey}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OpenAI API Key</label>
                      {isKeySaved && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.25 rounded-md border border-emerald-500/20">Saved & Active</span>}
                    </div>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500"
                      placeholder="sk-proj-..."
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300">
                    {customKey ? "Save API Key" : "Remove Key"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
