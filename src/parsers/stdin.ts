export async function readStdin(): Promise<string | null> {
	if (process.stdin.isTTY) return null;

	const chunks: Uint8Array[] = [];
	const stream = Bun.stdin.stream();

	for await (const chunk of stream) {
		chunks.push(chunk);
	}

	if (chunks.length === 0) return null;

	const decoder = new TextDecoder();
	return decoder.decode(Buffer.concat(chunks)).trim();
}
