import { Link } from "react-router-dom";
import { ArrowRightIcon, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#0B141A] text-[#E9EDEF] pt-12 pb-16">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(37,211,102,0.12)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-5 sm:px-8 text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold px-4 py-2 rounded-full shadow-lg shadow-[#25D366]/5">
                    <Sparkles className="size-3.5 text-[#25D366]" />
                    <span>AI-Powered Multi-Platform Social Media Scheduler</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                    Schedule smarter.{" "}
                    <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-[#25D366] via-emerald-300 to-[#128C7E] bg-clip-text text-transparent italic">
                        Broadcast instantly.
                    </span>
                </h1>

                {/* Subheadline featuring Challa Uday Kumar's vision */}
                <p className="text-[#8696A0] max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                    Designed for creators, startups, and developers. Upload your ideas once, generate platform-tailored copies using AI, and broadcast to LinkedIn, Twitter, and Instagram in one single click.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <Link
                        to="/login"
                        className="bg-gradient-to-r from-[#075E54] to-[#25D366] hover:from-[#128C7E] hover:to-[#25D366] text-white font-bold rounded-xl text-base px-8 py-4 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start Free Demo <ArrowRightIcon className="size-5" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="bg-[#111B21] hover:bg-[#1C2830] text-[#E9EDEF] border border-[#202C33] hover:border-[#2A3942] font-semibold rounded-xl text-base px-8 py-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 transition-all"
                    >
                        See How It Works
                    </a>
                </div>

                {/* Feature highlights bullets */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#8696A0] pt-2">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#25D366]" /> No credit card required</span>
                    <span className="flex items-center gap-1.5"><Zap className="size-4 text-[#25D366]" /> ChatGPT-speed AI generator</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#25D366]" /> Multi-user isolation</span>
                </div>
            </div>

            {/* Interactive Dashboard UI Preview Mockup */}
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12">
                <div className="rounded-2xl overflow-hidden border border-[#202C33] bg-[#111B21] shadow-2xl shadow-black/60">
                    {/* Fake Browser Toolbar Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0B141A] border-b border-[#202C33]">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-rose-500/80" />
                            <div className="size-3 rounded-full bg-amber-500/80" />
                            <div className="size-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="px-4 py-1 rounded-md bg-[#111B21] border border-[#202C33] text-[11px] text-[#8696A0] font-mono">
                            https://social-scheduler-pied-zeta.vercel.app/dashboard
                        </div>
                        <div className="size-3 opacity-0" />
                    </div>

                    {/* App Mock Content Grid */}
                    <div className="p-6 bg-[#0B141A] space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Scheduled Campaigns", val: "12", color: "text-[#25D366]" },
                                { label: "Total Views", val: "14.2k", color: "text-emerald-400" },
                                { label: "Connected Networks", val: "3", color: "text-teal-300" },
                                { label: "AI Quality Score", val: "98%", color: "text-green-400" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#111B21] border border-[#202C33] p-4 rounded-xl space-y-1 text-left">
                                    <p className="text-[10px] uppercase font-bold text-[#8696A0] tracking-wider">{stat.label}</p>
                                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Broadcast Live Preview Bar */}
                        <div className="bg-[#111B21] border border-[#202C33] p-4 rounded-xl flex items-center justify-between gap-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-[#075E54]/40 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">1-Click Broadcast Ready</p>
                                    <p className="text-[11px] text-[#8696A0]">LinkedIn · Twitter/X · Instagram simultaneously targeted</p>
                                </div>
                            </div>
                            <span className="px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-lg text-xs font-bold">
                                Active Demo
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
