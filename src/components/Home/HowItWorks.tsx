import { Sparkles, CheckCircle2, Share2, Layers } from "lucide-react";

const steps = [
    {
        num: "01",
        title: "Draft Prompt & Upload Media",
        desc: "Type a short post topic or upload your image/video asset once into the Create Post workspace.",
        icon: Layers
    },
    {
        num: "02",
        title: "Generate ChatGPT-Speed Copy",
        desc: "One click triggers AI that generates distinct, high-converting copy for LinkedIn, Twitter, and Instagram.",
        icon: Sparkles
    },
    {
        num: "03",
        title: "Select Platforms & Broadcast",
        desc: "Click 'Select All' and hit 'Publish Now' to broadcast simultaneously across all connected accounts.",
        icon: Share2
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-[#0B141A] border-t border-[#202C33]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                        <CheckCircle2 className="size-3.5" />
                        Simple 3-step workflow
                    </div>
                    <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-white">
                        How SocialFlow AI <span className="text-[#25D366]">works</span>
                    </h2>
                    <p className="text-[#8696A0] max-w-md mx-auto text-sm sm:text-base">
                        Built for speed — go from raw idea to live multi-channel broadcast in under 60 seconds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.num} className="bg-[#111B21] border border-[#202C33] p-8 rounded-2xl space-y-4 relative overflow-hidden group hover:border-[#25D366]/40 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-black text-[#25D366]/40 group-hover:text-[#25D366] transition-colors">{step.num}</span>
                                    <div className="size-10 rounded-xl bg-[#075E54]/30 border border-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                                        <Icon className="size-5" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                                <p className="text-xs text-[#8696A0] leading-relaxed">{step.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
