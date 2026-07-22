import { StarIcon, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Challa Uday Kumar",
        role: "2nd Year CS Student · Dayananda Sagar University (DSU), Bengaluru",
        avatar: "U",
        avatarBg: "from-[#075E54] to-[#25D366]",
        badge: "🎓 Builder & Creator",
        highlight: true,
        text: "I built SocialFlow AI as a 2nd-year student at DSU because I was spending hours manually posting on LinkedIn and Instagram. Now I generate a week of professional content in under 20 minutes — the AI knows exactly what works per platform. This is the tool I wish I'd had when I started my tech journey.",
    },
    {
        name: "Sarah K.",
        role: "Marketing Manager · SaaS Startup",
        avatar: "S",
        avatarBg: "from-rose-500 to-pink-500",
        badge: null,
        highlight: false,
        text: "SocialFlow AI saved our team 10+ hours a week. The AI composer is genuinely impressive — it writes content that sounds like us, not a robot. The calendar view makes planning campaigns actually enjoyable.",
    },
    {
        name: "Marcus L.",
        role: "Indie Creator · Tech Influencer",
        avatar: "M",
        avatarBg: "from-violet-500 to-purple-600",
        badge: null,
        highlight: false,
        text: "I used to dread posting. Now I queue up a full week in 20 minutes. The 'Select All' one-click broadcast across LinkedIn, Twitter, and Instagram is a game-changer for my reach.",
    },
    {
        name: "Priya D.",
        role: "Startup Founder",
        avatar: "P",
        avatarBg: "from-sky-500 to-blue-600",
        badge: null,
        highlight: false,
        text: "Finally a scheduler that's beautiful AND powerful. The dark-mode dashboard is stunning, and the analytics actually show me what content is working versus what flops.",
    },
];

export default function Testimonials() {
    return (
        <section className="py-24 bg-[#0B141A]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-14">
                    <div className="mb-6 inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[11px] font-semibold tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
                        <StarIcon className="size-3" />
                        Loved by creators & teams
                    </div>
                    <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight text-white">
                        Real creators.{" "}
                        <span className="text-[#25D366]">Real results.</span>
                    </h2>
                    <p className="mt-5 text-[#8696A0] max-w-md mx-auto">
                        Join thousands automating their social media presence with SocialFlow AI.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl border p-6 flex flex-col gap-4 relative transition-all duration-300 hover:scale-[1.02] ${
                                t.highlight
                                    ? "bg-gradient-to-br from-[#075E54]/30 to-[#128C7E]/10 border-[#25D366]/30 shadow-xl shadow-[#25D366]/5 md:col-span-2"
                                    : "bg-[#111B21] border-[#202C33] hover:border-[#2A3942]"
                            }`}
                        >
                            <Quote className={`size-6 ${t.highlight ? "text-[#25D366]/40" : "text-[#2A3942]"}`} />
                            
                            {t.badge && (
                                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] rounded-full w-fit">
                                    {t.badge}
                                </span>
                            )}

                            <p className={`text-sm leading-relaxed flex-1 ${t.highlight ? "text-[#E9EDEF]" : "text-[#8696A0]"}`}>
                                "{t.text}"
                            </p>

                            <div className={`flex items-center gap-3 pt-3 border-t ${t.highlight ? "border-[#25D366]/20" : "border-[#202C33]"}`}>
                                <div className={`size-10 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg`}>
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${t.highlight ? "text-white" : "text-[#E9EDEF]"}`}>{t.name}</div>
                                    <div className="text-[10px] text-[#8696A0] leading-snug">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
