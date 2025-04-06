<script lang="ts">
	// 👇 Define the expected data shape
	export let data: {
	  sensorData: Record<string, Record<string, string | number>>;
	};
  </script>
  
<h1>Sensor Data</h1>

{#each Object.entries(data.sensorData) as [sensorId, values]}
	<div style="margin-bottom: 1em;">
		<h3>{sensorId}</h3>
		<ul>
		{#each Object.entries(values) as [key, value]}
			<li>{key}: {value}</li>
		{/each}
		</ul>
	</div>
{/each}
  