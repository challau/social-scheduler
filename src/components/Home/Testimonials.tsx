import { StarIcon, Quote, Sparkles, Code2, GraduationCap, MapPin } from "lucide-react";

export default function Testimonials() {
    return (
        <section className="py-24 bg-[#0B141A] border-t border-[#202C33]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full">
                        <StarIcon className="size-3.5" />
                        Creator Spotlight
                    </div>
                    <h2 className="font-serif font-bold text-4xl sm:text-5xl leading-tight text-white">
                        Built by a creator, <br />
                        <span className="text-[#25D366]">for creators everywhere.</span>
                    </h2>
                    <p className="text-[#8696A0] max-w-lg mx-auto text-sm sm:text-base">
                        Here's why SocialFlow AI was created and how it automates social media publishing.
                    </p>
                </div>

                {/* Single Featured Creator Card - Challa Uday Kumar */}
                <div className="bg-gradient-to-br from-[#075E54]/30 via-[#111B21] to-[#128C7E]/20 border border-[#25D366]/40 rounded-3xl p-8 sm:p-12 text-left relative overflow-hidden shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-full text-xs font-bold">
                            <GraduationCap className="size-4" /> 2nd-Year CS Student · DSU
                        </div>
                        <Quote className="size-8 text-[#25D366]/40" />
                    </div>

                    <p className="text-base sm:text-lg text-[#E9EDEF] leading-relaxed italic font-medium">
                        "I built SocialFlow AI as a 2nd-year CS student at Dayananda Sagar University (DSU) because I was spending hours manually posting across LinkedIn, Twitter, and Instagram. Now I generate a full week of platform-optimized content in under 20 minutes with 1-click broadcasting. This is the tool I wish I had when I started my tech journey."
                    </p>

                    <div className="pt-6 border-t border-[#25D366]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-[#25D366]/20 border border-white/20">
                                U
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Challa Uday Kumar
                                    <Sparkles className="size-4 text-[#25D366]" />
                                </h3>
                                <p className="text-xs text-[#8696A0] flex items-center gap-1 mt-0.5">
                                    <MapPin className="size-3 text-[#25D366]" />
                                    Dayananda Sagar University (DSU), Bengaluru
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-[#0B141A] border border-[#202C33] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#25D366] w-fit">
                            <Code2 className="size-4" /> Founder & Lead Developer
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
