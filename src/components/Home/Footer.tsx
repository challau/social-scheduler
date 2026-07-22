import { Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-[#0B141A] border-t border-[#202C33] text-[#8696A0] py-12 text-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-[#075E54] to-[#25D366] p-2 rounded-xl shadow-lg shadow-[#25D366]/20">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <span className="text-lg font-extrabold text-white tracking-tight">SocialFlow AI</span>
                    </Link>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#8696A0]">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <Link to="/login" className="hover:text-white transition-colors">Login</Link>
                        <Link to="/login" className="hover:text-white transition-colors">Sign Up</Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-[#202C33] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
                    <p>© {new Date().getFullYear()} SocialFlow AI. Built with <Heart className="size-3 text-rose-500 inline mx-0.5" /> by <span className="text-white font-semibold">Challa Uday Kumar</span> (DSU, Bengaluru).</p>
                    <p className="text-[11px] text-[#3B4A54]">Lightning Fast Social Media Automation</p>
                </div>
            </div>
        </footer>
    );
}
