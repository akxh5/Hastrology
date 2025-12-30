export function joinPath(...segments: string[]): string {
	const parts = segments.reduce<string[]>((parts, segment) => {
		if (parts.length > 0) {
			segment = segment.replace(/^\//, "");
		}
		segment = segment.replace(/\/$/, "");
		return parts.concat(segment.split("/"));
	}, []);

	const resultParts: string[] = [];
	for (const part of parts) {
		if (part === ".") continue;
		if (part === "..") {
			resultParts.pop();
			continue;
		}
		resultParts.push(part);
	}

	const url = resultParts.join("/");
	return url.endsWith("/") ? url.slice(0, -1) : url;
}
