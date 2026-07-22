import { CalendarDaysIcon, Wand2Icon, Share2Icon, ZapIcon, BarChart3Icon, HashIcon } from "lucide-react";

const features = [
    {
        icon: CalendarDaysIcon,
        title: "Visual Content Scheduler",
        description: "Queue posts visually across month/week timelines with drag-and-drop ease and auto-best-time recommendations.",
    },
    {
        icon: Wand2Icon,
        title: "ChatGPT-Speed AI Engine",
        description: "Generate tailored captions, summaries, and platform hashtags in under 2 seconds powered by optimized AI prompts.",
    },
    {
        icon: BarChart3Icon,
        title: "Real-Time Channel Analytics",
        description: "Track views, likes, shares, comments, and platform breakdown in one unified high-contrast analytics hub.",
    },
    {
        icon: Share2Icon,
        title: "1-Click Multi-Platform Broadcast",
        description: "Target LinkedIn, Twitter/X, and Instagram simultaneously with a single 'Select All' broadcast click.",
    },
    {
        icon: ZapIcon,
        title: "Instant Non-Blocking Auth",
        description: "Zero loading hangs or cold-start freezes. Multi-user session isolation ensures clean, independent accounts.",
    },
    {
        icon: HashIcon,
        title: "Hashtag & Quality Optimizer",
        description: "Get AI quality scores for creativity, engagement prediction, and SEO reach before publishing.",
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#0B141A]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                        <ZapIcon className="size-3.5" />
                        Built for speed & scale
                    </div>
                    <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-white">
                        Automate your entire <br />
                        <span className="text-[#25D366]">social media workflow</span>
                    </h2>
                    <p className="text-[#8696A0] max-w-xl mx-auto text-sm sm:text-base">
                        From content drafting to multi-channel publishing — SocialFlow AI handles every step with lightning speed.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div key={f.title} className="bg-[#111B21] border border-[#202C33] hover:border-[#2A3942] rounded-2xl p-6 transition-all hover:scale-[1.02] space-y-3">
                            <div className="size-10 rounded-xl bg-[#075E54]/30 border border-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                                <f.icon className="size-5" />
                            </div>
                            <h3 className="text-base font-bold text-white">{f.title}</h3>
                            <p className="text-xs text-[#8696A0] leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
