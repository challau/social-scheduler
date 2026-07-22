import { CheckIcon, CircleCheckBigIcon } from "lucide-react";
import { Link } from "react-router-dom";

const pricingPlans = [
    {
        name: "Starter",
        price: "Free",
        period: "forever",
        description: "Ideal for students and creators starting out.",
        features: ["3 social accounts (LinkedIn, X, IG)", "Unlimited scheduled posts", "ChatGPT-speed AI generation", "Visual calendar dashboard"],
        cta: "Get Started Free",
        highlight: false,
    },
    {
        name: "Pro Creator",
        price: "$19",
        period: "/month",
        description: "For active creators automating cross-platform growth.",
        features: ["Everything in Free", "Unlimited AI generations", "1-Click 'Select All' broadcast", "Custom brand voice settings", "Priority support"],
        cta: "Start Free Trial",
        highlight: true,
    },
    {
        name: "Agency & Teams",
        price: "$49",
        period: "/month",
        description: "For agencies and multi-brand managers.",
        features: ["Everything in Pro", "5 team workspaces", "Multi-user account isolation", "Custom AI personas", "Dedicated API access"],
        cta: "Contact Sales",
        highlight: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-[#0B141A] border-t border-[#202C33]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                        <CircleCheckBigIcon className="size-3.5" />
                        Simple Transparent Pricing
                    </div>
                    <h2 className="font-serif font-bold text-4xl sm:text-5xl leading-tight text-white">
                        Plans for every stage <br />
                        <span className="text-[#25D366]">of growth</span>
                    </h2>
                    <p className="text-[#8696A0] max-w-md mx-auto text-sm sm:text-base">
                        Start free, upgrade when you scale. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl border p-8 flex flex-col justify-between relative transition-all duration-300 ${
                                plan.highlight
                                    ? "bg-gradient-to-b from-[#075E54]/40 to-[#111B21] border-[#25D366]/50 shadow-2xl shadow-[#25D366]/10"
                                    : "bg-[#111B21] border-[#202C33] hover:border-[#2A3942]"
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#075E54] to-[#25D366] text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm font-bold text-[#25D366] mb-2">{plan.name}</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">{plan.price}</span>
                                        <span className="text-xs text-[#8696A0]">{plan.period}</span>
                                    </div>
                                    <p className="text-xs text-[#8696A0] mt-3 leading-relaxed">{plan.description}</p>
                                </div>

                                <ul className="space-y-3 pt-4 border-t border-[#202C33]">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-xs text-[#E9EDEF]">
                                            <div className="size-4 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                                                <CheckIcon className="size-2.5 text-[#25D366]" />
                                            </div>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                to="/login"
                                className={`mt-8 text-center font-bold text-xs py-3.5 px-6 rounded-xl transition-all ${
                                    plan.highlight
                                        ? "bg-gradient-to-r from-[#075E54] to-[#25D366] text-white hover:opacity-90 shadow-lg shadow-[#25D366]/20"
                                        : "bg-[#0B141A] text-white border border-[#202C33] hover:bg-[#1C2830]"
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
