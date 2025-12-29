'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { AstroCard } from './AstroCard';
import { AstroCard as AstroCardType } from '@/types';
import { buildEnterLotteryInstruction } from '@/lib/hastrology_program';

const PAYMENT_AMOUNT = 0.01; // SOL

// Helper function to get card color based on ruling planet
const getCardColor = (planet: string): string => {
    const colorMap: Record<string, string> = {
        sun: '#F59E0B',
        moon: '#3B82F6',
        mars: '#EF4444',
        mercury: '#06B6D4',
        jupiter: '#22C55E',
        venus: '#EC4899',
        saturn: '#9333EA'
    };
    return colorMap[planet.toLowerCase()] || '#9333EA';
};

// Helper function to get card gradient based on ruling planet
const getCardGradient = (planet: string): string => {
    const gradientMap: Record<string, string> = {
        sun: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        moon: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        mars: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        mercury: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        jupiter: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        venus: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
        saturn: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)'
    };
    return gradientMap[planet.toLowerCase()] || 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)';
};

// Demo cards for preview mode (keeping for backwards compatibility)
const DEMO_CARDS: Record<CardType, AstroCardType> = {
    overall_vibe: {
        front: {
            tagline: "Main character energy activated",
            luck_score: 88,
            vibe_status: "Stellar",
            energy_emoji: "✨",
            zodiac_sign: "Leo"
        },
        back: {
            detailed_reading: "The sun is trining your natal Jupiter, expanding your ego in the best way possible. That confidence isn't delusional, it's destiny.",
            hustle_alpha: "Pitch the big idea today.",
            shadow_warning: "Don't stepping on others' toes.",
            lucky_assets: { number: "1", color: "Gold", power_hour: "2 PM" }
        },
        ruling_planet_theme: "sun"
    },
    shine: {
        front: {
            tagline: "You will shine at Leadership today",
            luck_score: 92,
            vibe_status: "Stellar",
            energy_emoji: "👑",
            zodiac_sign: "Leo"
        },
        back: {
            detailed_reading: "People are looking to you for direction. Your natural authority is at an all time high.",
            hustle_alpha: "Take charge of the meeting.",
            shadow_warning: "Avoid micromanaging.",
            lucky_assets: { number: "5", color: "Orange", power_hour: "10 AM" }
        },
        ruling_planet_theme: "sun"
    },
    health: {
        front: {
            tagline: "Your body needs a systems check",
            luck_score: 65,
            vibe_status: "Shaky",
            energy_emoji: "🔋",
            zodiac_sign: "Virgo"
        },
        back: {
            detailed_reading: "Mars is draining your battery. That fatigue is a signal, not a weakness.",
            hustle_alpha: "Maximize sleep ROI.",
            shadow_warning: "Avoid heavy lifting after 6 PM.",
            lucky_assets: { number: "4", color: "Green", power_hour: "9 PM" }
        },
        ruling_planet_theme: "mars"
    },
    wealth: {
        front: {
            tagline: "The money printer is warming up",
            luck_score: 85,
            vibe_status: "Ascending",
            energy_emoji: "💸",
            zodiac_sign: "Taurus"
        },
        back: {
            detailed_reading: "Venus is entering your financial sector. Unexpected liquidity is likely.",
            hustle_alpha: "Review your portfolio.",
            shadow_warning: "Don't impulse buy luxury items.",
            lucky_assets: { number: "8", color: "Emerald", power_hour: "4 PM" }
        },
        ruling_planet_theme: "venus"
    },
    career: {
        front: {
            tagline: "You're operating in Founder Mode",
            luck_score: 90,
            vibe_status: "Stellar",
            energy_emoji: "🚀",
            zodiac_sign: "Capricorn"
        },
        back: {
            detailed_reading: "Saturn says your hard work is about to pay dividends. Stay the course.",
            hustle_alpha: "Network vertically today.",
            shadow_warning: "Avoid burnout.",
            lucky_assets: { number: "10", color: "Grey", power_hour: "11 AM" }
        },
        ruling_planet_theme: "saturn"
    },
    love: {
        front: {
            tagline: "Your aura is glitching (in a good way)",
            luck_score: 75,
            vibe_status: "Ascending",
            energy_emoji: "💘",
            zodiac_sign: "Libra"
        },
        back: {
            detailed_reading: "Someone is obsessing over you. Your magnetism is tangible.",
            hustle_alpha: "Send the risky text.",
            shadow_warning: "Avoid exes.",
            lucky_assets: { number: "2", color: "Pink", power_hour: "8 PM" }
        },
        ruling_planet_theme: "venus"
    },
    social: {
        front: {
            tagline: "Social battery at 40%",
            luck_score: 40,
            vibe_status: "Shaky",
            energy_emoji: "🪫",
            zodiac_sign: "Aquarius"
        },
        back: {
            detailed_reading: "Too much noise. You need isolation to recharge your genius.",
            hustle_alpha: "Go ghost mode.",
            shadow_warning: "Avoid large crowds.",
            lucky_assets: { number: "0", color: "Blue", power_hour: "Midnight" }
        },
        ruling_planet_theme: "uranus"
    },
    growth: {
        front: {
            tagline: "Evolution is uncomfortable",
            luck_score: 80,
            vibe_status: "Ascending",
            energy_emoji: "🌱",
            zodiac_sign: "Sagittarius"
        },
        back: {
            detailed_reading: "You are shedding a skin. It hurts because it's working.",
            hustle_alpha: "Learn a new skill.",
            shadow_warning: "Don't look back.",
            lucky_assets: { number: "9", color: "Purple", power_hour: "7 AM" }
        },
        ruling_planet_theme: "jupiter"
    },
    luck: {
        front: {
            tagline: "Glitch in the matrix detected",
            luck_score: 99,
            vibe_status: "Stellar",
            energy_emoji: "🍀",
            zodiac_sign: "Pisces"
        },
        back: {
            detailed_reading: "The universe is rigged in your favor today. Buy the ticket.",
            hustle_alpha: "Take the big risk.",
            shadow_warning: "None.",
            lucky_assets: { number: "777", color: "Rainbow", power_hour: "All Day" }
        },
        ruling_planet_theme: "neptune"
    },
    wild_card: {
        front: {
            tagline: "Expect the unexpected",
            luck_score: 50,
            vibe_status: "Eclipse",
            energy_emoji: "🃏",
            zodiac_sign: "Gemini"
        },
        back: {
            detailed_reading: "Chaos is a ladder. Climb it.",
            hustle_alpha: "Pivot hard.",
            shadow_warning: "Trust no one.",
            lucky_assets: { number: "???", color: "Black", power_hour: "3 AM" }
        },
        ruling_planet_theme: "mercury"
    }
};

export const HoroscopeSection: FC = () => {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { user, card, setCard, loading, setLoading } = useStore();

    const [status, setStatus] = useState<'checking' | 'ready' | 'paying' | 'generating' | 'complete'>('checking');
    const [error, setError] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        if (publicKey && user) {
            checkStatus();
        }
    }, [publicKey, user]);

    const checkStatus = async () => {
        if (!publicKey) return;

        try {
            const result = await api.getStatus(publicKey.toBase58());

            if (result.status === 'exists') {
                // Handle both new format (card) and old format (cards) for backwards compatibility
                if (result.card) {
                    setCard(result.card);
                    setStatus('complete');
                } else if (result.cards) {
                    // Old format: convert first card or use a default
                    const firstCardKey = Object.keys(result.cards)[0];
                    if (firstCardKey) {
                        setCard(result.cards[firstCardKey]);
                        setStatus('complete');
                    }
                }
            } else if (result.status === 'paid') {
                setIsPaid(true);
                setStatus('ready');
            } else {
                setIsPaid(false);
                setStatus('ready');
            }
        } catch (err) {
            console.error('Failed to check status:', err);
            setStatus('ready');
        }
    };

    const handlePayment = async () => {
        if (!publicKey) return;

        setLoading(true);
        setError(null);

        let signature = '';

        try {
            // Only require payment if not already verified on-chain
            if (!isPaid) {
                if (!sendTransaction) return;

                setStatus('paying');
                // Build enter_lottery instruction
                const instruction = await buildEnterLotteryInstruction(publicKey, connection);
                const transaction = new Transaction().add(instruction);

                signature = await sendTransaction(transaction, connection);
                // Wait for confirmation to ensure backend can verify PDA
                await connection.confirmTransaction(signature, 'confirmed');
            }

            // Generate horoscope cards
            setStatus('generating');

            // Call backend 
            const result = await api.confirmHoroscope(publicKey.toBase58(), signature || 'ALREADY_PAID');

            setCard(result.card);
            setStatus('complete');
            setIsPaid(false); // Reset for next day/session logic
        } catch (err: any) {
            console.error('Payment/Generation error:', err);

            // Should we check for "already processed" error from chain? 
            // If so, we could retry without payment.
            // But relying on `checkStatus` (which calls `verifyLotteryParticipation`) is safer.

            setError(err.message || 'Failed to process request');
            setStatus('ready');
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setLoading(true);
        setError(null);
        setStatus('generating');

        // Simulate generation delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Use demo card (first card from demo cards)
        const demoCard = DEMO_CARDS.overall_vibe;
        setCard(demoCard);
        setStatus('complete');
        setLoading(false);
    };

    const handleNewReading = () => {
        setCard(null);
        setStatus('ready');
    };

    if (!user || !publicKey) {
        return null;
    }

    return (
        <section id="horoscope-section" className="min-h-screen flex items-center justify-center py-20 px-4 relative">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="w-full max-w-3xl relative z-10"
            >
                {status === 'ready' && (
                    <div className="glass-panel rounded-3xl p-8 md:p-12 text-center border-t border-white/10">
                        <div className="inline-block p-4 rounded-full bg-purple-500/10 mb-6 animate-pulse-slow">
                            <span className="text-4xl">✨</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-200">
                            Ready for Your Astro Cards?
                        </h2>
                        <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">
                            Get your personalized daily horoscope card. A cosmic reading tailored to your birth chart and current energy.
                        </p>

                        {error && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-center justify-center gap-2">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}

                        <div className="">
                            {/* Payment Option */}
                            <div className="group relative">
                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="relative w-full h-full bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-all duration-300"
                                >
                                    <div className="text-purple-400 font-bold tracking-wider text-sm uppercase">Full Reading</div>
                                    <div className="text-3xl font-bold text-white">{PAYMENT_AMOUNT} SOL</div>
                                    <div className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold shadow-lg shadow-purple-900/20 group-hover:shadow-purple-600/40 transition-all">
                                        {loading ? 'Processing...' : (isPaid ? 'Generate Cards (Paid)' : 'Unlock Cards')}
                                    </div>
                                </button>
                            </div>

                            {/* Demo Option */}
                            {/* <button
                                onClick={handleDemo}
                                disabled={loading}
                                className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-blue-400/30 group"
                            >
                                <div className="text-blue-400 font-bold tracking-wider text-sm uppercase">Preview</div>
                                <div className="text-3xl font-bold text-white">Free</div>
                                <div className="text-slate-500 text-sm">Sample Cards</div>
                                <div className="w-full py-3 mt-2 bg-slate-800 text-blue-300 rounded-xl font-bold border border-blue-500/20 group-hover:bg-blue-500/10 group-hover:text-blue-200 transition-all">
                                    Try Demo
                                </div>
                            </button> */}
                        </div>
                    </div>
                )}

                {(status === 'paying' || status === 'generating') && (
                    <div className="glass-panel rounded-3xl p-16 text-center">
                        <div className="cosmic-loader mb-8"></div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            {status === 'paying' ? 'Confirming Transaction...' : 'Generating Your Cards...'}
                        </h3>
                        <p className="text-slate-400 text-lg animate-pulse">
                            {status === 'paying' ? 'Please approve the request in your wallet' : 'AI is crafting your cosmic cards ✨'}
                        </p>
                    </div>
                )}

                {status === 'complete' && card && (
                    <div className="w-full flex flex-col items-center">
                        <div className="w-full max-w-md mx-auto" style={{ height: '60vh' }}>
                            <AstroCard
                                card={{
                                    ...card,
                                    type: 'overall_vibe',  // Default type for single card
                                    color: getCardColor((card as any).ruling_planet || (card as any).ruling_planet_theme || 'mars'),
                                    gradient: getCardGradient((card as any).ruling_planet || (card as any).ruling_planet_theme || 'mars')
                                }}
                                index={0}
                                isActive={true}
                                totalCards={1}
                                onSwipe={() => {}}
                            />
                        </div>

                        {/* New Reading Button */}
                        <motion.div
                            className="flex justify-center mt-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={handleNewReading}
                                className="py-3 px-8 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-white/5 hover:border-white/10"
                            >
                                ↻ New Reading
                            </button>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </section>
    );
};

