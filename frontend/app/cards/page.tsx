"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { AstroCard } from "@/components/AstroCard";
import { api } from "@/lib/api";
import { buildEnterLotteryInstruction } from "@/lib/hastrology_program";
import { useStore } from "@/store/useStore";

const PAYMENT_AMOUNT = 0.01;

const CardsPage: FC = () => {
	const { publicKey, sendTransaction, disconnect } = useWallet();
	const { connection } = useConnection();
	const { user, card, setCard, loading, setLoading } = useStore();

	const [status, setStatus] = useState<
		"checking" | "ready" | "paying" | "generating" | "complete"
	>("checking");
	const [error, setError] = useState<string | null>(null);
	const [isPaid, setIsPaid] = useState(false);

	const router = useRouter();
	const wasConnected = useRef(false);

	useEffect(() => {
		if (wasConnected.current && !publicKey) {
			router.push("/");
		}
		wasConnected.current = !!publicKey;
	}, [publicKey, router]);

	const checkStatus = useCallback(async () => {
		if (!publicKey) return;

		try {
			const result = await api.getStatus(publicKey.toBase58());

			if (result.status === "exists" && result.card) {
				setCard(result.card);
				setStatus("complete");
			} else if (result.status === "paid") {
				setIsPaid(true);
				setStatus("ready");
			} else {
				setIsPaid(false);
				setStatus("ready");
			}
		} catch (err) {
			console.error("Failed to check status:", err);
			setStatus("ready");
		}
	}, [publicKey, setCard]);

	useEffect(() => {
		if (publicKey && user) {
			checkStatus();
		}
	}, [publicKey, user, checkStatus]);

	const handlePayment = async () => {
		if (!publicKey) return;

		setLoading(true);
		setError(null);

		let signature = "";

		try {
			if (!isPaid) {
				if (!sendTransaction) return;

				setStatus("paying");
				const instruction = await buildEnterLotteryInstruction(
					publicKey,
					connection,
				);
				const transaction = new Transaction().add(instruction);

				signature = await sendTransaction(transaction, connection);
				await connection.confirmTransaction(signature, "confirmed");
			}

			setStatus("generating");
			const result = await api.confirmHoroscope(
				publicKey.toBase58(),
				signature || "ALREADY_PAID",
			);

			setCard(result.card);
			setStatus("complete");
			setIsPaid(false);
		} catch (err) {
			console.error("Payment/Generation error:", err);
			setError(
				err instanceof Error
					? err.message || "Failed to process request"
					: "Failed to process request",
			);
			setStatus("ready");
		} finally {
			setLoading(false);
		}
	};

	if (!user || !publicKey) {
		return null;
	}

	return (
		<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
			{/* Disconnect Button */}
			<div className="fixed top-6 right-6 z-50">
				<button
					onClick={() => {
						if (!publicKey) return;
						disconnect();
					}}
					className="flex flex-row gap-2 items-center
      bg-[#1F1F1F]
      border border-[#FC5411]
      text-white
      px-4
      py-2
      rounded-xl
      font-medium
      hover:bg-[#262626]
      hover:shadow-[0_0_20px_rgba(252,84,17,0.35)]
      transition
    "
					type="button"
				>
					<img
						alt="Solana Logo"
						className="w-4 h-5"
						src="https://solana.com/src/img/branding/solanaLogoMark.svg"
					/>
					{publicKey.toBase58().slice(0, 4)}...
					{publicKey.toBase58().slice(-4)}
				</button>
			</div>

			<div className="absolute inset-y-0 right-0 w-1/2 z-0 flex flex-col">
				<div className="relative h-full w-full">
					<img
						alt="Upper Background"
						className="w-full h-full object-cover"
						src="/bg-home-upper.png"
					/>
				</div>
				<div className="relative h-full w-full">
					<img
						alt="Lower Background"
						className="w-full h-full object-cover"
						src="/bg-home-lower.png"
					/>
				</div>
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-transparent" />
			</div>

			<div className="absolute left-170 top-0 h-full w-auto z-0 pointer-events-none">
				{/* Golden glow on right edge */}
				<div
					className="
      absolute
      top-1/2
      left-full
      -translate-y-1/2
      w-[680px]
      h-[680px]
      rounded-full
      blur-[120px]
      opacity-60
    "
					style={{
						background:
							"radial-gradient(circle, rgba(255,180,80,0.75), rgba(252,84,17,0.45) 35%, transparent 70%)",
					}}
				/>

				<img
					alt="Orange Planet"
					className="h-full w-auto object-contain object-left"
					src="/ellipse-left.png"
				/>
			</div>

			<img
				alt="Black Planet"
				className="absolute left-170 top-0 h-full w-auto object-contain object-left z-10"
				src="/ellipse-black.png"
			/>

			{/* LEFT BLACK PANEL — CARD UNLOCK */}
			<div className="absolute inset-y-0 left-0 w-1/2 z-20 flex items-start justify-center pt-35">
				<div className="w-full max-w-2xl px-10">
					<AnimatePresence mode="wait">
						{/* READY STATE */}
						{(status === "ready" || status === "checking") && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								initial={{ opacity: 0, y: 20 }}
								key="ready"
								transition={{ duration: 0.5 }}
							>
								<h1 className="text-5xl font-semibold text-white mb-2">
									Get Your Astro Card
								</h1>
								<p className="text-gray-400 mb-16 mt-2 text-2xl">
									Get your personalized daily horoscope cards. 10 cards covering
									your vibe, health, wealth, love & more.
								</p>

								{/* Payment Card */}
								<div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-8 mb-6">
									<div className="text-center">
										<p className="text-gray-400 text-md uppercase tracking-wider mb-3">
											FULL READING
										</p>
										<div className="flex items-baseline justify-center gap-2 mb-6 mt-4">
											<span className="text-6xl font-bold text-white">
												{PAYMENT_AMOUNT}
											</span>
											<span className="text-2xl text-gray-400">SOL</span>
										</div>
									</div>
								</div>

								{/* Error Message */}
								{error && (
									<div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
										<p className="text-red-400 text-sm text-center">{error}</p>
									</div>
								)}

								{/* Unlock Button */}
								<button
									onClick={handlePayment}
									disabled={loading || status === "checking"}
									className={`
										w-full
										bg-[#1A1A1A]
										border border-[#FC5411]
										hover:bg-[#262626]
										text-white
										font-semibold
										py-4
										rounded-xl
										transition-all
										flex items-center justify-center gap-2
										${loading || status === "checking" ? "opacity-50 cursor-not-allowed" : ""}
									`}
									type="button"
								>
									{status === "checking" ? (
										<>
											<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
												<title>Loading</title>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													fill="none"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													fill="currentColor"
												/>
											</svg>
											<span>Checking Status...</span>
										</>
									) : loading ? (
										<>
											<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
												<title>Loading</title>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													fill="none"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												/>
												<path
													className="opacity-75"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													fill="currentColor"
												/>
											</svg>
											<span>Processing...</span>
										</>
									) : isPaid ? (
										<>
											<span>Generate My Cards</span>
											<span className="text-lg">✨</span>
										</>
									) : (
										<span>Unlock Astro Cards</span>
									)}
								</button>
							</motion.div>
						)}

						{/* PROCESSING STATES */}
						{(status === "paying" || status === "generating") && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								initial={{ opacity: 0, y: 20 }}
								key="processing"
								transition={{ duration: 0.5 }}
							>
								<div className="text-center mt-45">
									<div className="mb-8">
										<div className="w-20 h-20 mx-auto relative">
											<motion.div
												animate={{ rotate: 360 }}
												className="absolute inset-0 rounded-full border-4 border-t-[#FC5411] border-r-[#FC5411] border-b-transparent border-l-transparent"
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "linear",
												}}
											/>
										</div>
									</div>

									<h2 className="text-4xl font-bold text-white mb-4">
										{status === "paying"
											? "Confirming Transaction"
											: "Generating Your Cards"}
									</h2>
									<p className="text-gray-400 text-lg">
										{status === "paying"
											? "Please approve the transaction in your wallet"
											: "AI is crafting your personalized readings ✨"}
									</p>
								</div>
							</motion.div>
						)}

						{/* COMPLETE STATE */}
						{status === "complete" && card && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								initial={{ opacity: 0, y: 20 }}
								key="complete"
								transition={{ duration: 0.5 }}
							>
								<h1 className="text-5xl font-semibold text-white mb-2">
									Your Astro Card
								</h1>
								<p className="text-gray-400 mb-8 mt-2 text-xl">
									Your personalized reading is ready! ✨
								</p>

								<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
									<div className="text-sm text-gray-400 mb-2">
										{card.ruling_planet_theme} Energy
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* RIGHT SIDE - CARD PREVIEW */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="
					relative z-10
					text-center
					px-6
					max-w-xl
					ml-auto
					mr-24
					md:mr-10
					lg:mr-15
				"
				initial={{ opacity: 0, y: 30 }}
				transition={{ duration: 0.9, ease: "easeOut" }}
			>
				{status === "complete" && card ? (
					<motion.div
						animate={{ opacity: 1, scale: 1 }}
						initial={{ opacity: 0, scale: 0.9 }}
						transition={{ delay: 0.3, duration: 0.6 }}
						className="w-full max-w-md mx-auto"
						style={{ height: "70vh", minHeight: "600px" }}
					>
						<AstroCard card={card} />
					</motion.div>
				) : (
					<>
						<Link href="/" className="inline-block">
							<motion.img
								alt="Hastrology Logo"
								animate={{ scale: 1, opacity: 1 }}
								className="-mt-4 md:-mt-25
									w-96 md:w-72 lg:w-120
									mx-auto
									drop-shadow-[0_0_20px_rgba(251,146,60,0.35)]
								"
								initial={{ scale: 0.9, opacity: 0 }}
								src="/Hastrology.png"
								transition={{ delay: 0.2, duration: 0.8 }}
							/>
						</Link>

						<motion.p
							animate={{ opacity: 1 }}
							className="mt-6 text-lg md:text-xl text-[#CCCCCC] leading-relaxed"
							initial={{ opacity: 0 }}
							transition={{ delay: 0.4, duration: 0.8 }}
						>
							Unlock the secrets of the stars with AI-powered insights on
							Solana.
							<br />
							<span className="text-[#CCCCCC] mt-0">
								Your destiny is written in the code of the cosmos. ✨
							</span>
						</motion.p>
					</>
				)}
			</motion.div>

			<div className="absolute bottom-11 left-0 w-full z-30 px-6">
				<div className="font-display max-w-7xl mx-auto flex items-center justify-between text-md text-[#8A8A8A]">
					<span className="font-display">
						©2025 <span className="text-white">Hastrology</span>
					</span>
					<div className="flex gap-6">
						<span className="text-white">Your cosmic journey on Solana.</span>
						<a className="hover:text-white transition" href="/abc">
							About us
						</a>
						<a className="hover:text-white transition" href="/abc">
							Cookie Policy
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CardsPage;
