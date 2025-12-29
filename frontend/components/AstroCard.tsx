import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AstroCardWithMeta } from '@/types';

interface AstroCardProps {
    card: AstroCardWithMeta;
    index: number;
    isActive: boolean;
    totalCards: number;
    onSwipe: (direction: 'left' | 'right') => void;
}

export const AstroCard: React.FC<AstroCardProps> = ({
    card,
    index,
    isActive,
    totalCards,
    onSwipe
}) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Calculate stacking effect
    const stackOffset = index * 4;
    const scale = 1 - (index * 0.05);
    const zIndex = totalCards - index;
    const opacity = 1 - (index * 0.2);

    // Gestures
    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActive) {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <motion.div
            className="absolute top-0 w-full h-full cursor-pointer perspective-1000"
            style={{
                zIndex,
                y: stackOffset,
                scale,
                opacity: Math.max(0, opacity),
                transformOrigin: 'top center',
            }}
            animate={{
                scale: isActive ? 1 : scale,
                y: isActive ? 0 : stackOffset,
                opacity: isActive ? 1 : Math.max(0, opacity),
                rotate: isActive ? 0 : (index % 2 === 0 ? 2 : -2) // Slight random rotation for stack
            }}
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            onClick={handleFlip}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT FACE */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl border border-white/10"
                    style={{
                        background: card.gradient,
                        boxShadow: `0 20px 40px -10px ${card.color}40`,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90 uppercase tracking-wider border border-white/10">
                            {card.type.replace('_', ' ')}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-4xl filter drop-shadow-md">{card.front.energy_emoji}</span>
                            <span className="text-[10px] text-white/60 font-mono mt-1 uppercase tracking-widest opacity-80">{card.front.zodiac_sign}</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col justify-center my-4 space-y-6 text-center">
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">Current Vibe</div>
                            <div className="text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">
                                {card.front.vibe_status}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">The Message</div>
                            <h3 className="text-2xl font-medium text-white/95 leading-snug italic">
                                "{card.front.tagline}"
                            </h3>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-white/60">Luck Score</span>
                            <span className="text-xl font-bold text-white">{card.front.luck_score}%</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-wider text-white/60">Tap to flip</span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mt-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                    <path d="M21 12l-9-9-9 9" transform="rotate(90 12 12)" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BACK FACE */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-[2rem] p-6 flex flex-col shadow-2xl border border-white/10 overflow-hidden"
                    style={{
                        background: '#0F0F11', // Dark card for reverse
                        transform: "rotateY(180deg)",
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        boxShadow: `0 20px 40px -10px ${card.color}20`,
                    }}
                >
                    {/* Decorative Gradient Blob */}
                    <div
                        className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[80px] opacity-20 pointer-events-none"
                        style={{ background: card.color }}
                    />

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="text-xs font-medium text-white/40 uppercase tracking-widest">
                            Cosmic Download
                        </div>
                        <div
                            className="bg-white/5 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar relative z-10 space-y-6">
                        {/* Detailed Reading */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                                <span className="" style={{ color: card.color }}>★</span> Insight
                            </h4>
                            <p className="text-sm leading-relaxed text-white/70 font-light">
                                {card.back.detailed_reading}
                            </p>
                        </div>

                        {/* Hustle Alpha */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Hustle Alpha</h4>
                            <p className="text-sm text-white/90 font-medium">
                                {card.back.hustle_alpha}
                            </p>
                        </div>

                        {/* Shadow Warning */}
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400/80 flex items-center gap-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                Shadow Warning
                            </h4>
                            <p className="text-xs text-white/60 italic">
                                {card.back.shadow_warning}
                            </p>
                        </div>

                        {/* Lucky Assets Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                <div className="text-[10px] text-white/40 uppercase">Number</div>
                                <div className="text-sm font-bold text-white mt-1">{card.back.lucky_assets.number}</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                <div className="text-[10px] text-white/40 uppercase">Color</div>
                                <div className="text-sm font-bold text-white mt-1" style={{ color: card.back.lucky_assets.color === 'Gold' ? '#FCD34D' : 'white' }}>
                                    {card.back.lucky_assets.color}
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                <div className="text-[10px] text-white/40 uppercase">Power Hr</div>
                                <div className="text-sm font-bold text-white mt-1">{card.back.lucky_assets.power_hour}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
