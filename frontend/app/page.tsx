"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { Hero } from "@/components/Hero";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

export default function Home() {
	const { publicKey, connected } = useWallet();
	const { setWallet, setUser, reset } = useStore();

	useEffect(() => {
		const checkUserProfile = async () => {
			if (connected && publicKey) {
				setWallet(publicKey.toBase58());

				try {
					const profileResponse = await api.getUserProfile(
						publicKey.toBase58(),
					);

					if (profileResponse?.user) {
						setUser(profileResponse.user);
					} else {
						setUser(null);
					}
				} catch (error) {
					console.error("Error checking user profile:", error);

					setUser(null);
				}
			} else {
				reset();
			}
		};

		checkUserProfile();
	}, [connected, publicKey, reset, setUser, setWallet]);

	return (
		<main className="relative">
			{/* Hero Section */}
			<Hero />
		</main>
	);
}
