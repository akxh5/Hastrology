"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { type FC, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

export const Hero: FC = () => {
	const { publicKey, connected } = useWallet();
	const router = useRouter();
	const { user, setUser, setWallet } = useStore();
	const [isChecking, setIsChecking] = useState(false);

	// Check user status when wallet connects
	useEffect(() => {
		const checkUserStatus = async () => {
			if (connected && publicKey) {
				setIsChecking(true);
				try {
					const address = publicKey.toBase58();
					setWallet(address);
					const profileResponse = await api.getUserProfile(address);

					if (profileResponse?.user) {
						setUser(profileResponse.user);
					} else {
						setUser(null);
					}
				} catch (error) {
					console.error("Error checking user:", error);
					setUser(null);
				} finally {
					setIsChecking(false);
				}
			}
		};

		checkUserStatus();
	}, [connected, publicKey, setUser, setWallet]);

	const handleConnectClick = () => {
		if (isChecking) return;

		// If wallet is connected and user exists, go to cards
		if (connected && user) {
			router.push("/cards");
			return;
		}

		// Otherwise go to login page
		router.push("/login");
	};

	return (
		<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
			<div className="absolute inset-0 z-0 flex flex-col">
				<div className="relative h-1/2 w-full">
					<img
						alt="Upper Background"
						className="w-full h-full object-cover"
						src="/bg-home-upper.png"
					/>
				</div>
				<div className="relative h-1/2 w-full">
					<img
						alt="Lower Background"
						className="w-full h-full object-cover"
						src="/bg-home-lower.png"
					/>
				</div>

				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-transparent" />
			</div>

			<img
				alt="Orange Planet"
				className="absolute left-0 top-0 h-full w-auto object-contain object-left z-0"
				src="/ellipse-left.png"
			/>

			{/* BLACK ELLIPSE - Overlapping the orange ellipse from left */}
			<img
				alt="Black Planet"
				className="absolute left-0 top-0 h-full w-auto object-contain object-left z-10"
				src="/ellipse-black.png"
			/>

			{/* STAR FIELD */}

			{/* CONTENT */}
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="relative z-10 text-center px-6 max-w-4xl"
				initial={{ opacity: 0, y: 30 }}
				transition={{ duration: 0.9, ease: "easeOut" }}
			>
				{/* TITLE */}
				<motion.img
					alt="Hastrology Logo"
					animate={{ scale: 1, opacity: 1 }}
					className="-mt-4 md:-mt-25
            w-96 md:w-72 lg:w-166
            mx-auto
            drop-shadow-[0_0_20px_rgba(251,146,60,0.35)]
          "
					initial={{ scale: 0.9, opacity: 0 }}
					src="/Hastrology.png"
					transition={{ delay: 0.2, duration: 0.8 }}
				/>

				{/* SUBTEXT */}
				<motion.p
					animate={{ opacity: 1 }}
					className="mt-6 text-lg md:text-2xl text-[#CCCCCC] leading-relaxed"
					initial={{ opacity: 0 }}
					transition={{ delay: 0.4, duration: 0.8 }}
				>
					Unlock the secrets of the stars with AI-powered insights on Solana.
					<br />
					<span className="text-[#CCCCCC] mt-0">
						Your destiny is written in the code of the cosmos. ✨
					</span>
				</motion.p>

				{/* CTA */}
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="mt-10 flex flex-col items-center gap-4"
					initial={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.7, duration: 0.8 }}
				>
					<button
						onClick={handleConnectClick}
						disabled={isChecking}
						type="button"
						className={`
              bg-[#1f1f1f]
              hover:bg-[#121212]
              text-white
              h-12
              px-8
              py-6
              border border-[#fc5411]
           pt-2.5
              rounded-xl
              transition-all
              ${isChecking ? "opacity-50 cursor-not-allowed" : ""}
            `}
					>
						{isChecking
							? "Locating Your Stars..."
							: connected && user
								? "See Your Stars"
								: "Connect Wallet"}
					</button>
				</motion.div>
			</motion.div>

			{/* BOTTOM FADE */}
			<div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-black to-transparent" />
			<img
				alt="Orange Planet"
				className="absolute right-0 top-0 h-full w-auto object-contain object-left z-0"
				src="/ellipse-right.png"
			/>

			<img
				alt="Black Planet"
				className="absolute right-0 top-0 h-full w-auto object-contain object-left z-10"
				src="/ellipse-black-right.png"
			/>

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
