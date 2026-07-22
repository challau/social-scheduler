import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, Sparkles, Menu, X } from "lucide-react";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isLoggedIn = !!localStorage.getItem("token");

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
                ? "bg-[#111B21]/95 backdrop-blur-xl border-b border-[#202C33] shadow-lg shadow-black/20"
                : "bg-transparent"
        }`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" onClick={() => scrollTo(0, 0)} className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-[#075E54] to-[#25D366] p-2 rounded-xl shadow-lg shadow-[#25D366]/20">
                        <Sparkles className="size-4 text-white" />
                    </div>
                    <span className="text-lg font-extrabold text-white tracking-tight">SocialFlow AI</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8696A0]">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    {isLoggedIn ? (
                        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-[#075E54] to-[#25D366] hover:opacity-90 text-white px-4 py-2 rounded-full shadow-lg shadow-[#25D366]/20 transition-opacity">
                            Go to Dashboard <ArrowRightIcon className="size-3.5" />
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-[#8696A0] hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link to="/login" className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-[#075E54] to-[#25D366] hover:opacity-90 text-white px-4 py-2 rounded-full shadow-lg shadow-[#25D366]/20 transition-opacity">
                                Get Started Free <ArrowRightIcon className="size-3.5" />
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-xl bg-[#111B21] border border-[#202C33] text-[#8696A0]"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileOpen && (
                <div className="md:hidden bg-[#111B21] border-b border-[#202C33] px-4 py-4 space-y-3">
                    <a href="#features" className="block text-sm text-[#8696A0] hover:text-white py-2" onClick={() => setMobileOpen(false)}>Features</a>
                    <a href="#how-it-works" className="block text-sm text-[#8696A0] hover:text-white py-2" onClick={() => setMobileOpen(false)}>How it works</a>
                    <a href="#pricing" className="block text-sm text-[#8696A0] hover:text-white py-2" onClick={() => setMobileOpen(false)}>Pricing</a>
                    <Link to="/login" className="block w-full text-center py-3 bg-gradient-to-r from-[#075E54] to-[#25D366] text-white font-bold rounded-xl text-sm mt-2">
                        Get Started Free →
                    </Link>
                </div>
            )}
        </nav>
    );
}
