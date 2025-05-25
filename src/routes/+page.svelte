<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Chart from 'chart.js/auto';

	let chart: Chart | null = null;
	let chartCanvas: HTMLCanvasElement | null = null;

	let sensorData: { sensor_id: string; timestamp: string; values: string }[] = [];
	let error: string | null = null;

	let sensorInterval: number | null = null;
	let intervalLoading = false;
	let intervalError: string | null = null;

	async function fetchSensorData() {
		try {
			// Replace with your actual Cloudflare Workers link and secret key
		const res = await fetch('https://{YOUR_OWN_CLOUDFLARE_WORKERS_LINK}.workers.dev/api/v1/sensor/data', {
			headers: {
			'Authorization': 'Bearer {YOUR_SECRET_KEY}'
			}
		});

		if (!res.ok) {
			throw new Error(`Error: ${res.status}`);
		}

		sensorData = await res.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
		}
	}

	async function fetchSensorConfig(sensorId: string) {
		intervalLoading = true;
		intervalError = null;
		try {
			// Replace with your actual Cloudflare Workers link and secret key
			const res = await fetch(`https://{YOUR_OWN_CLOUDFLARE_WORKERS_LINK}.workers.dev/api/v1/sensor/config?sensor_id=${sensorId}`, {
				headers: {
					'Authorization': 'Bearer {YOUR_SECRET_KEY}'
				}
			});
			if (!res.ok) {
				throw new Error(`Error fetching config: ${res.status}`);
			}
			const configArray = await res.json();
			// Access the first item in the array and get 'update_interval'
			if (Array.isArray(configArray) && configArray.length > 0) {
				sensorInterval = configArray[0].update_interval;
			} else {
				throw new Error('Invalid config data');
			}
		} catch (err) {
			intervalError = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			intervalLoading = false;
		}
	}

	async function updateSensorInterval(sensorId: string, newInterval: number) {
		try {
			// Replace with your actual Cloudflare Workers link and secret key
			const res = await fetch(`https://{YOUR_OWN_CLOUDFLARE_WORKERS_LINK}.workers.dev/api/v1/sensor/config?sensor_id=${sensorId}`, {
				method: 'PUT',
				headers: {
					'Authorization': 'Bearer {YOUR_SECRET_KEY}',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ update_interval: newInterval })
			});
			if (!res.ok) {
				throw new Error(`Error updating interval: ${res.status}`);
			}
			alert('Interval updated successfully!');
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Unknown error');
		}
	}

	onMount(async () => {
		fetchSensorData();
	});

	let selectedRow: typeof sensorData[0] | null = null;

	function truncateSensorId(id: string) {
		if (id.length > 15) {
			return id.slice(0, 5) + '...' + id.slice(-4);
		}
		return id;
	}

	async function openModal(row: typeof sensorData[0]) {
		selectedRow = row;
		fetchSensorConfig(row.sensor_id);
		// Replace with your actual Cloudflare Workers link and secret key
		const res = await fetch(`https://{YOUR_OWN_CLOUDFLARE_WORKERS_LINK}.workers.dev/api/v1/sensor/data?sensor_id=${row.sensor_id}`, {
			headers: {
				'Authorization': 'Bearer {YOUR_SECRET_KEY}'
			}
		});
		const dataPoints = await res.json();
		// After data is fetched, initialize chart
		await tick();
		if (chart) {
			chart.destroy();
		}
		if (chartCanvas) {
			chart = new Chart(chartCanvas, {
				type: 'line',
				data: {
					labels: dataPoints.map((d: any) => d.timestamp),
					datasets: [
						{
							label: 'Temperature (°C)',
							data: dataPoints.map((d: any) => JSON.parse(d.values).temperature),
							borderColor: 'red',
							fill: false
						},
						{
							label: 'Humidity (%)',
							data: dataPoints.map((d: any) => JSON.parse(d.values).humidity),
							borderColor: 'blue',
							fill: false
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false
				}
			});
		}
	}

	function closeModal() {
		selectedRow = null;
	}

</script>

<main>
	<h1>PARVEKE</h1>
	<section>
		{#if error}
			<p>Error: {error}</p>
			{:else if sensorData.length === 0}
			<p>Loading...</p>
			{:else}
			{#each sensorData as row}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="tile" on:click={() => openModal(row)}>
					<div class="title">{truncateSensorId(row.sensor_id)}</div>
					<div class="values">
						{#each Object.entries(JSON.parse(row.values)) as [key, value]}
							<p class="value">{key}: {value}</p>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</section>

	{#if selectedRow}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" on:click={closeModal}>
			<div class="modal" on:click|stopPropagation>
				<button class="close-button" on:click={closeModal}>×</button>
				<h2>Parveke > {selectedRow.sensor_id}</h2>

				{#if intervalLoading}
					<p>Loading sensor settings...</p>
				{:else if intervalError}
					<p>Error: {intervalError}</p>
				{:else}
					<div class="interval-settings">
						<label for="interval">Update interval (seconds):</label>
						<input id="interval" type="number" bind:value={sensorInterval} min="1" />
						<button on:click={() => sensorInterval !== null && updateSensorInterval(selectedRow!.sensor_id, sensorInterval)}>Save</button>
					</div>
				{/if}

				<canvas bind:this={chartCanvas}></canvas>

				<!--
				<p>Temperature: {JSON.parse(selectedRow.values).temperature} °C</p>
				<p>Humidity: {JSON.parse(selectedRow.values).humidity} %</p>
				<p>Timestamp: {selectedRow.timestamp}</p>
				-->


			</div>
		</div>
	{/if}
</main>

<div class="menu">
	<button class="dashboard">
		<img src="data-analytics.png" alt="Dashboard" />
	</button>
	<button class="add">
		<img src="more.png" alt="Add new sensor" />
	</button>
	<button class="refresh" on:click={fetchSensorData}>
		<img src="reload.png" alt="Refresh" />
	</button>
</div>

<style>
	.interval-settings {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.interval-settings input {
		width: 200px;
		height: 1.5rem;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		text-align: center;
		font-size: 1.5rem;
	}

	.interval-settings button {
		padding: 0.5rem 1rem;
		border: none;
		background: #4CAF50;
		color: white;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 0.75rem;
		background: rgba(0,0,0,0);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		z-index: 20;
	}

	.modal {
		position: relative;
		display: flex;
		flex-direction: column;
		background: white;
		padding: 2rem;
		border-radius: 2rem;
		box-shadow: 0 0 1rem rgba(0,0,0,0.2);
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		text-align: center;
	}

	canvas {
		flex: 1;
		width: 100%;
		height: 100%;
		max-height: 500px;
		margin-top: 1rem;
		margin-left: -2rem;
		margin-right: -2rem;
	}

	.close-button {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		background: none;
		border: none;
		border-radius: 3rem;
		font-size: 2.75rem;
		cursor: pointer;
		color: #2196F3;
	}

	.close-button:hover {
		color: #0e5caa;
	}

	:global(body) {
		margin: 0;
		min-height:100dvh;
		background: linear-gradient(133deg, rgba(76,175,80,1) 0%, rgba(46,125,50,1) 80%);
		background: #2196F3;
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
	}

	.menu {
		position: fixed;
		display: flex;
		justify-content: space-between;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 4.5rem;
		background-color: rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.1);
		z-index: 10;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		border-radius: 2rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(1rem);
	}

	.menu > button {
		width: 3rem;
		height: 3rem;
		border: none;
		background-color: transparent;
	}

	.menu img {
		width: 2.5rem;
		height: 2.5rem;
		opacity: 0.6;
	}

	h1 {
		color: #fff;
		font-size: 2rem;
		margin-bottom: 2rem;
	}
	
	section {
  		display: grid;
  		grid-template-columns: 1fr 1fr; /* Two equal columns */
		gap: 1.5rem;
		justify-content: center;
		width: 100%;
	}

	.tile {
		width: 175px;
		height: 175px;
		background: #fff;
		display: flex;
		position: relative;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 2rem;
		box-shadow: 0 0 0 5px rgba(0,0,0,0.1);
		cursor: pointer;
	}

	.tile > .title {
		position: absolute;
		top: 0;
		font-size: 1.5rem;
		color: #333;
		padding: 0.5rem;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.tile > .values {
		position: absolute;
		bottom: 0;
		text-align: center;
		padding: 0.5rem;
	}

	.tile > .values > .value {
		font-size: 1.2rem;
		color: #333;
	}
</style>