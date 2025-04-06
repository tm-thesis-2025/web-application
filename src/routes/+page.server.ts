// src/routes/+page.server.js
export async function load({ fetch }: { fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> }) {
	const res = await fetch('https://solitary-haze-5e36.marko-rautiainen.workers.dev/'); // replace with your actual Worker URL
	const sensorData = await res.json();

	return { sensorData };
}