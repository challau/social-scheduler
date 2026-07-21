import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { API_URL } from "../config";
import { 
  Sparkles, 
  Upload, 
  Calendar, 
  Send, 
  FileText, 
  Trash2, 
  Globe, 
  Clock,
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

export default function CreatePost() {
  const navigate = useNavigate();
  
  // Prompt & Media State
  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<{ url: string; media_type: string; thumbnail_url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI Content State
  const [aiTitle, setAiTitle] = useState("");
  const [recPlatform, setRecPlatform] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [activeTab, setActiveTab] = useState("instagram");
  const [generating, setGenerating] = useState(false);

  // Platform Specific Edits
  const [instagramCopy, setInstagramCopy] = useState("");
  const [instagramTags, setInstagramTags] = useState("");
  const [instagramStory, setInstagramStory] = useState("");

  const [linkedinCopy, setLinkedinCopy] = useState("");
  const [linkedinSummary, setLinkedinSummary] = useState("");

  const [twitterCopy, setTwitterCopy] = useState("");
  const [twitterTags, setTwitterTags] = useState("");

  // Scheduling State
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin", "twitter"]);
  const [publishing, setPublishing] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New SaaS brand voice and content scoring states
  const [brandVoice, setBrandVoice] = useState("");
  const [contentScore, setContentScore] = useState<{ creativity: number; engagement_prediction: number; seo_score: number } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.brand_voice) {
            setBrandVoice(data.brand_voice);
          }
        }
      } catch (err) {
        console.warn("Failed to load user profile for brand voice initialization", err);
      }
    };
    fetchProfile();
  }, []);

  // Handle Drag & Drop / File Select
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAlert(null);

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers,
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMedia(data);
      } else {
        throw new Error(data.detail || "Upload failed");
      }
    } catch (err: any) {
      setAlert({ type: "error", message: `Media upload failed: ${err.message || "server unreachable"}` });
    } finally {
      setUploading(false);
    }
  };

  // Trigger AI Content Generation
  const handleAIGeneration = async () => {
    if (!prompt && !media) {
      setAlert({ type: "error", message: "Please enter a prompt or upload media first." });
      return;
    }

    setGenerating(true);
    setAlert(null);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    } : { "Content-Type": "application/json" };

    try {
      const res = await fetch(`${API_URL}/ai/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, media_url: media?.url, brand_voice: brandVoice })
      });
      const data = await res.json();

      if (res.ok) {
        populateAIGenerations(data);
      } else {
        throw new Error(data.detail || "AI Generation failed");
      }
    } catch (err: any) {
      setAlert({ type: "error", message: `AI generation failed: ${err.message || "server unreachable"}` });
    } finally {
      setGenerating(false);
    }
  };

  const populateAIGenerations = (data: any) => {
    setAiTitle("AI Generated Social Campaign");
    setRecPlatform(data.recommended_platform || "LinkedIn");
    setBestTime(data.best_posting_time || "10:00 AM");
    setContentScore(data.content_score || null);

    // Instagram
    setInstagramCopy(data.instagram_caption || "");
    setInstagramTags(data.hashtags?.join(", ") || "");
    setInstagramStory(data.summary || "Instagram visual campaign idea.");

    // LinkedIn
    setLinkedinCopy(data.linkedin_caption || "");
    setLinkedinSummary(data.summary || "");

    // Twitter
    setTwitterCopy(data.twitter_caption || "");
    setTwitterTags(data.hashtags?.join(", ") || "");
  };

  // Submit Post to Database (Publish or Schedule)
  const handleSubmitPost = async (statusType: "published" | "scheduled" | "draft") => {
    if (!prompt && !media) {
      setAlert({ type: "error", message: "Cannot save empty post base." });
      return;
    }

    if (selectedPlatforms.length === 0) {
      setAlert({ type: "error", message: "Please select at least one publishing platform checkbox." });
      return;
    }

    if (statusType === "scheduled" && !scheduledTime) {
      setAlert({ type: "error", message: "Please specify a scheduled time." });
      return;
    }

    setPublishing(true);
    setAlert(null);

    // Format tags from twitter/instagram input values
    const igTagsList = instagramTags.split(",").map(t => t.trim()).filter(t => t);
    const twTagsList = twitterTags.split(",").map(t => t.trim()).filter(t => t);
    const uniqueTags = Array.from(new Set([...igTagsList, ...twTagsList]));

    const payload = {
      content: prompt,
      media_url: media?.url,
      platforms: selectedPlatforms,
      status: statusType === "published" ? "draft" : statusType,
      scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      ai_generation: aiTitle ? {
        summary: linkedinSummary || instagramStory,
        instagram_caption: instagramCopy,
        linkedin_caption: linkedinCopy,
        twitter_caption: twitterCopy,
        hashtags: uniqueTags
      } : null
    };

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    } : { "Content-Type": "application/json" };

    try {
      // Step 1: Create post campaign in database
      const resCreate = await fetch(`${API_URL}/posts/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const dataCreate = await resCreate.json();

      if (!resCreate.ok) throw new Error(dataCreate.detail || "Failed to create post campaign");

      const postId = dataCreate.post_id;

      // Step 2: Handle immediate publication trigger
      if (statusType === "published") {
        const resPub = await fetch(`${API_URL}/posts/publish`, {
          method: "POST",
          headers,
          body: JSON.stringify({ post_id: postId })
        });
        const dataPub = await resPub.json();
        if (!resPub.ok) throw new Error(dataPub.detail || "Publishing service call failed");

        // Per-platform results: [{platform, status, error?}, ...]
        const results: { platform: string; status: string; error?: string }[] = dataPub;
        const succeeded = results.filter(r => r.status === "success").map(r => r.platform);
        const failed = results.filter(r => r.status !== "success");

        if (failed.length === 0) {
          setAlert({ type: "success", message: `Published to ${succeeded.join(", ")} successfully!` });
        } else if (succeeded.length > 0) {
          const failDetails = failed.map(f => `${f.platform} (${f.error || "failed"})`).join("; ");
          setAlert({
            type: "error",
            message: `Published to ${succeeded.join(", ")}, but failed on: ${failDetails}`
          });
        } else {
          const failDetails = failed.map(f => `${f.platform}: ${f.error || "failed"}`).join("; ");
          setAlert({ type: "error", message: `Publishing failed — ${failDetails}` });
        }

        // Only leave the page when nothing failed, so errors stay readable
        if (failed.length === 0) {
          setTimeout(() => navigate("/dashboard"), 1500);
        }
        return;
      }

      // Step 3: Handle explicit schedule trigger verification
      if (statusType === "scheduled") {
        const resSched = await fetch(`${API_URL}/posts/schedule`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            post_id: postId,
            scheduled_time: new Date(scheduledTime).toISOString()
          })
        });
        const dataSched = await resSched.json();
        if (!resSched.ok) throw new Error(dataSched.detail || "Scheduling endpoint verification failed");
      }

      setAlert({
        type: "success",
        message: statusType === "scheduled"
          ? "Campaign scheduled successfully!"
          : "Draft saved successfully!"
      });

      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (err: any) {
      setAlert({
        type: "error",
        message: err.message || "Request failed — check your connection and try again."
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI Content Engine
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Upload media once and generate optimized posts across LinkedIn, Twitter/X, and Instagram.
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Creator Input */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <FileText className="size-4.5 text-violet-400" />
                Post Details
              </h3>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Draft prompt or post base</label>
                <textarea
                  className="w-full h-32 px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  placeholder="Describe your post or upload a photo of your college hackathon, workspaces, or SaaS launch..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Media Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attach media</label>
                {media ? (
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden group">
                    {media.media_type === "video" ? (
                      <video src={media.url} controls className="w-full max-h-60 object-cover" />
                    ) : (
                      <img src={media.url} alt="Attached Preview" className="w-full max-h-60 object-cover" />
                    )}
                    <button 
                      onClick={() => setMedia(null)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors border border-red-500/20"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border border-dashed border-slate-800 hover:border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-900/10 transition-all group">
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    <Upload className="size-8 text-slate-500 group-hover:text-slate-300 transition-colors mb-2" />
                    <span className="text-sm font-semibold text-slate-300">
                      {uploading ? "Uploading media..." : "Click to select or drag photo/video"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Supports PNG, JPG, MP4</span>
                  </label>
                )}
              </div>

              {/* Brand Voice / Style Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Brand Voice / Style</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="e.g. Professional & technical, casual humor, friendly..."
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                />
              </div>

              <button
                onClick={handleAIGeneration}
                disabled={generating || uploading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-violet-500/10"
              >
                <Sparkles className="size-4.5" />
                {generating ? "AI generating versions..." : "Generate cross-platform versions"}
              </button>
            </div>

            {/* Content Score Card */}
            {contentScore && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Sparkles className="size-4 text-violet-400" />
                  AI Content Quality Score
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                      <span>CREATIVITY</span>
                      <span className="text-violet-400 font-bold">{contentScore.creativity}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{ width: `${contentScore.creativity}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                      <span>ENGAGEMENT PREDICTION</span>
                      <span className="text-cyan-400 font-bold">{contentScore.engagement_prediction}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${contentScore.engagement_prediction}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                      <span>SEO & REACH OPTIMIZATION</span>
                      <span className="text-emerald-400 font-bold">{contentScore.seo_score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${contentScore.seo_score}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Datepicker Scheduling card */}
            {aiTitle && (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-5">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="size-4.5 text-amber-400" />
                  Publish Strategy
                </h3>

                {/* Platforms selection checkboxes */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Target Platforms</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.length === 3}
                        onChange={(e) => {
                          setSelectedPlatforms(e.target.checked ? ["instagram", "linkedin", "twitter"] : []);
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500 size-4"
                      />
                      Select all
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className={`flex items-center gap-2.5 cursor-pointer bg-slate-950/40 border px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedPlatforms.includes("instagram") ? "border-pink-500/40 text-pink-400" : "border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes("instagram")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, "instagram"]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== "instagram"));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-pink-500 size-4"
                      />
                      <Instagram className="size-4" />
                      Instagram
                    </label>
                    <label className={`flex items-center gap-2.5 cursor-pointer bg-slate-950/40 border px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedPlatforms.includes("linkedin") ? "border-blue-500/40 text-blue-400" : "border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes("linkedin")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, "linkedin"]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== "linkedin"));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 size-4"
                      />
                      <Linkedin className="size-4" />
                      LinkedIn
                    </label>
                    <label className={`flex items-center gap-2.5 cursor-pointer bg-slate-950/40 border px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedPlatforms.includes("twitter") ? "border-sky-500/40 text-sky-400" : "border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes("twitter")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, "twitter"]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== "twitter"));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-sky-400 focus:ring-sky-400 size-4"
                      />
                      <Twitter className="size-4" />
                      Twitter/X
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Set scheduled time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => handleSubmitPost("scheduled")}
                    disabled={publishing}
                    className="py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-400 font-semibold rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="size-4" />
                    Schedule Post
                  </button>
                  <button
                    onClick={() => handleSubmitPost("published")}
                    disabled={publishing}
                    className="py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="size-4" />
                    {publishing ? "Publishing..." : "Publish Now"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Previews */}
          <div className="space-y-6">
            {!aiTitle ? (
              <div className="bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <Sparkles className="size-10 text-slate-700 animate-pulse mb-3" />
                <h4 className="font-semibold text-slate-400 text-sm">Waiting for AI input</h4>
                <p className="text-xs max-w-xs mt-1">Connect accounts, add a brief content prompt, and trigger the AI copy generations.</p>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 space-y-6">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/20 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-violet-400" />
                    <span className="text-xs font-semibold text-slate-400">Best platform:</span>
                    <span className="text-xs font-bold text-violet-400 capitalize bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">{recPlatform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-400">Recommended time:</span>
                    <span className="text-xs font-semibold text-slate-300">{bestTime}</span>
                  </div>
                </div>

                {/* Previews Tabs */}
                <div className="space-y-4">
                  <div className="flex border-b border-slate-800">
                    <button
                      onClick={() => setActiveTab("instagram")}
                      className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                        activeTab === "instagram" ? "text-pink-500 border-pink-500" : "text-slate-400 border-transparent hover:text-slate-200"
                      }`}
                    >
                      <Instagram className="size-4" /> Instagram
                    </button>
                    <button
                      onClick={() => setActiveTab("linkedin")}
                      className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                        activeTab === "linkedin" ? "text-blue-500 border-blue-500" : "text-slate-400 border-transparent hover:text-slate-200"
                      }`}
                    >
                      <Linkedin className="size-4" /> LinkedIn
                    </button>
                    <button
                      onClick={() => setActiveTab("twitter")}
                      className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                        activeTab === "twitter" ? "text-sky-400 border-sky-400" : "text-slate-400 border-transparent hover:text-slate-200"
                      }`}
                    >
                      <Twitter className="size-4" /> Twitter/X
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="space-y-4 min-h-60">
                    {/* Instagram Tab */}
                    {activeTab === "instagram" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instagram Caption</label>
                          <textarea
                            className="w-full h-24 px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-pink-500/60 transition-colors resize-none"
                            value={instagramCopy}
                            onChange={(e) => setInstagramCopy(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hashtags</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-pink-500/60"
                            value={instagramTags}
                            onChange={(e) => setInstagramTags(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campaign Summary</label>
                          <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl text-xs text-pink-400/90 leading-relaxed">
                            {instagramStory}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn Tab */}
                    {activeTab === "linkedin" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Professional LinkedIn Post</label>
                          <textarea
                            className="w-full h-36 px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
                            value={linkedinCopy}
                            onChange={(e) => setLinkedinCopy(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">LinkedIn Summary</label>
                          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-400/90 leading-relaxed">
                            {linkedinSummary}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Twitter/X Tab */}
                    {activeTab === "twitter" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tweet Copy</label>
                            <span className={`text-[10px] font-bold ${twitterCopy.length > 280 ? "text-red-500" : "text-slate-500"}`}>
                              {twitterCopy.length}/280
                            </span>
                          </div>
                          <textarea
                            className="w-full h-24 px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-sky-400/60 transition-colors resize-none"
                            value={twitterCopy}
                            onChange={(e) => setTwitterCopy(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hashtags</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-400/60"
                            value={twitterTags}
                            onChange={(e) => setTwitterTags(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
