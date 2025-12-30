'use client';

import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import BN from 'bn.js';
import { fetchLotteryState, fetchUserTicket, LotteryState } from '@/lib/hastrology_program';

interface LotteryCountdownProps {
    onBack?: () => void;
}

export const LotteryCountdown: FC<LotteryCountdownProps> = ({ onBack }) => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [state, setState] = useState<LotteryState | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);
    const [status, setStatus] = useState<'loading' | 'countdown' | 'drawing' | 'result'>('loading');
    const [result, setResult] = useState<'won' | 'lost' | 'pending' | null>(null);
    const [winnerAddress, setWinnerAddress] = useState<string | null>(null);
    const [prize, setPrize] = useState<string | null>(null);

    // Poll for lottery state
    useEffect(() => {
        const checkState = async () => {
            try {
                const lotteryState = await fetchLotteryState(connection);
                if (lotteryState) {
                    setState(lotteryState);

                    // Logic to determine status
                    const now = Math.floor(Date.now() / 1000);
                    const end = lotteryState.lotteryEndtime.toNumber();

                    if (now >= end) {
                        setStatus('drawing'); // Time passed, waiting for draw
                    } else {
                        setStatus('countdown');
                    }
                }
            } catch (err) {
                console.error("Error fetching state:", err);
            }
        };

        checkState();
        const interval = setInterval(checkState, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [connection]);

    // Countdown Timer
    useEffect(() => {
        if (!state || status !== 'countdown') return;

        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const end = state.lotteryEndtime.toNumber();
            const diff = end - now;

            if (diff <= 0) {
                setStatus('drawing');
                setTimeLeft({ h: 0, m: 0, s: 0 });
            } else {
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                setTimeLeft({ h, m, s });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [state, status]);

    const handleCheckResult = async () => {
        if (!state || !publicKey) return;

        // Check if we have a winner in the state
        // The 'winner' field in state applies to:
        // - The CURRENT lottery IF 'isDrawing' is true? No, resolve_draw sets it.
        // - The PREVIOUS lottery IF payout ran (since it increments ID but keeps winner field? Unlikely to be reliable indefinitely)
        // Best bet: Check if 'winner' > 0.

        // However, if we are in 'drawing' state (time passed), we are waiting for 'winner' to be set.

        if (state.winner.eqn(0)) {
            alert("The draw hasn't happened yet! Please wait for the Oracle to pick a winner.");
            return;
        }

        // Check our ticket
        try {
            // We need to know WHICH lottery ID to check.
            // If the user is checking NOW, and a winner is set, it's likely for the Current ID matching the winner?
            // Wait, resolve_draw sets winner for 'currentLotteryId'. 
            // Payout increments 'currentLotteryId'.
            // So if 'winner' > 0 and 'totalParticipants' == 0 (reset), then winner is for (ID-1).
            // If 'winner' > 0 and 'totalParticipants' > 0, then winner is for (ID).

            let idToCheck = state.currentLotteryId;
            if (state.totalParticipants.eqn(0)) {
                // Payout happened, ID incremented
                idToCheck = state.currentLotteryId.subn(1);
            }

            // Ticket Number is 0-indexed in PDA? 
            // In program: winner is 1-indexed U64. 0 means no winner.
            // Our fix used (winner - 1) for PDA.

            const pdaWinnerIndex = state.winner.subn(1);

            // We want to check if *this user* is the winner.
            // But we don't know our ticket number easily without fetching ALL receipts.
            // Actually, we can just fetch the 'winningTicket' PDA using the known winner index.
            // If the .user matches us, WE WON!

            const winningTicket = await fetchUserTicket(connection, idToCheck, pdaWinnerIndex);

            if (winningTicket) {
                setWinnerAddress(winningTicket.user.toBase58());
                setPrize((winningTicket.prizeAmount.toNumber() / 1e9).toFixed(2));

                if (winningTicket.user.equals(publicKey)) {
                    setResult('won');
                } else {
                    setResult('lost');
                }
            } else {
                setResult('pending');
            }

        } catch (err) {
            console.error(err);
            setResult('pending');
        }
    };

    if (!state) return null;

    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
                {/* Stars/Grid overlay could go here */}
            </div>

            <div className="relative z-10 w-full max-w-2xl px-4 text-center">

                <AnimatePresence mode="wait">
                    {/* COUNTDOWN STATE */}
                    {(status === 'countdown' || (status === 'drawing' && !result)) && (
                        <motion.div
                            key="countdown"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl"
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-widest uppercase mb-6">
                                Next Cosmic Draw
                            </span>

                            {/* Timer Display */}
                            <div className="flex justify-center gap-4 mb-8">
                                {timeLeft ? (
                                    <>
                                        <TimeControl value={timeLeft.h} label="HRS" />
                                        <span className="text-4xl font-light text-white/20 mt-2">:</span>
                                        <TimeControl value={timeLeft.m} label="MIN" />
                                        <span className="text-4xl font-light text-white/20 mt-2">:</span>
                                        <TimeControl value={timeLeft.s} label="SEC" />
                                    </>
                                ) : (
                                    <div className="text-4xl text-white/50 animate-pulse">Calculating...</div>
                                )}
                            </div>

                            {status === 'drawing' ? (
                                <div className="space-y-6">
                                    <p className="text-xl text-yellow-300 font-light">
                                        ✨ The stars are aligning... Draw is Ready!
                                    </p>
                                    <button
                                        onClick={handleCheckResult}
                                        className="py-4 px-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-black shadow-lg hover:scale-105 transition-transform"
                                    >
                                        Check If You Won 🏆
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-lg">
                                    Your lucky stars are locked in. <br />
                                    Come back when the timer hits zero.
                                </p>
                            )}

                            {/* Lottery ID Badge */}
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <p className="text-sm text-slate-500">
                                    Lottery ID: #{state.currentLotteryId.toString()} • Total Pot: {(Number(state.ticketPrice) * Number(state.totalParticipants) / 1e9).toFixed(2)} SOL
                                </p>
                            </div>

                            {onBack && (
                                <button onClick={onBack} className="mt-6 text-slate-500 hover:text-white text-sm transition-colors">
                                    ← Back to Horoscope
                                </button>
                            )}

                        </motion.div>
                    )}

                    {/* RESULT STATE */}
                    {result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`rounded-3xl p-12 shadow-2xl border ${result === 'won'
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                                    : 'bg-white/5 border-white/10'
                                } backdrop-blur-2xl`}
                        >
                            <div className="text-6xl mb-6">
                                {result === 'won' ? '🎉' : '💫'}
                            </div>

                            <h2 className={`text-4xl font-bold mb-4 ${result === 'won' ? 'text-yellow-300' : 'text-white'}`}>
                                {result === 'won' ? 'YOU WON!' : 'Divine Timing'}
                            </h2>

                            {result === 'won' ? (
                                <p className="text-xl text-white/80 mb-8">
                                    The stars have blessed you with <span className="font-bold text-yellow-300">{prize} SOL</span>!
                                </p>
                            ) : (
                                <p className="text-lg text-slate-300 mb-8">
                                    This wasn't your round, but the cosmos is always turning.<br />
                                    Winner was: <span className="font-mono text-purple-300">{winnerAddress?.slice(0, 4)}...{winnerAddress?.slice(-4)}</span>
                                </p>
                            )}

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => { setResult(null); setStatus('countdown'); }}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                                >
                                    Check Again Later
                                </button>
                                {onBack && (
                                    <button onClick={onBack} className="px-6 py-3 text-slate-400 hover:text-white">
                                        Back to Horoscope
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </section>
    );
};

const TimeControl = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="relative bg-black/40 rounded-2xl p-4 w-24 h-24 flex items-center justify-center border border-white/10">
            <span className="text-4xl font-mono text-white font-bold">
                {value.toString().padStart(2, '0')}
            </span>
        </div>
        <span className="text-xs font-bold text-slate-500 mt-2 tracking-widest">{label}</span>
    </div>
);
