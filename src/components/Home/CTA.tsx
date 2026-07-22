import { Link } from "react-router-dom";
import { ArrowRightIcon, Sparkles } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-24 bg-[#0B141A] relative overflow-hidden border-t border-[#202C33]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="bg-gradient-to-br from-[#075E54]/40 via-[#111B21] to-[#128C7E]/20 border border-[#25D366]/30 rounded-3xl p-10 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
                    <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold px-4 py-2 rounded-full">
                        <Sparkles className="size-3.5" />
                        Ready to automate your social growth?
                    </div>

                    <h2 className="font-serif font-bold text-3xl sm:text-5xl text-white leading-tight">
                        Start scheduling smarter <br />
                        <span className="text-[#25D366]">in less than 2 minutes.</span>
                    </h2>

                    <p className="text-[#8696A0] max-w-lg mx-auto text-sm sm:text-base">
                        Join creators and founders automating LinkedIn, Twitter/X, and Instagram with SocialFlow AI.
                    </p>

                    <div className="pt-2">
                        <Link
                            to="/login"
                            className="bg-gradient-to-r from-[#075E54] to-[#25D366] hover:from-[#128C7E] hover:to-[#25D366] text-white font-bold rounded-xl text-base px-8 py-4 inline-flex items-center gap-2 shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02]"
                        >
                            Get Started Free <ArrowRightIcon className="size-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
