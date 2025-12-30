import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { fetchXUser } from "@/lib/twitter";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	if (error) {
		return NextResponse.redirect(
			new URL("/link-x?error=twitter_auth_failed", request.url),
		);
	}
	if (!code || !state) {
		return NextResponse.redirect(
			new URL("/link-x?error=invalid_callback", request.url),
		);
	}

	let parsedState: Record<string, string> = {};
	if (state) {
		try {
			const decodedState = decodeURIComponent(state);
			const base64Decoded = atob(decodedState);
			const jsonString = decodeURIComponent(base64Decoded);
			parsedState = JSON.parse(jsonString);
		} catch (error) {
			console.error("Error parsing X state:", error);
			return NextResponse.redirect(
				new URL("/link-x?error=twitter_auth_failed", request.url),
			);
		}
	}

	try {
		const result = await fetchXUser({
			code,
			url,
			path: "user",
		});

		if (!result) {
			throw new Error("Failed to get user data");
		}

		const externalId = `twitter_${result.userData.data.id}`;
		/*const existingAccountProvider = await api.getUserProfile({
			accountId: externalId,
			accountType: "twitter",
		});
		if (existingAccountProvider) {
			return NextResponse.redirect(
				new URL("/login?error=account_exisits", request.url),
			);
		}*/

		await api.regsiterX({
			id: parsedState.user_id,
			twitterId: externalId,
			twitterUsername:
				result?.userData?.data?.username ?? result?.userData?.data?.name,
			twitterProfileUrl: result?.userData?.data?.profile_image_url,
		});
		const response = NextResponse.redirect(
			new URL("/link-x?twitter_success=true", request.url),
		);

		return response;
	} catch (error) {
		console.error("Twitter callback error:", error);
		return NextResponse.redirect(
			new URL("/link-x?error=auth_processing_failed", request.url),
		);
	}
}
