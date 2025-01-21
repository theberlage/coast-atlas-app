<script lang="ts">
	import { slideData } from '$lib/shared/stores/markdownSlides.js'
	import { menu } from '$lib/shared/stores/componentStates.js'
	import { fade } from 'svelte/transition'

	const toggleMenu = () => menu.toggle()

	// Based on eyeball animation: https://codepen.io/GabEsu/pen/VdKjPE
	let marker: SVGCircleElement | undefined
	let markerRect: DOMRect | undefined
	let R: number | undefined
	let centerX: number | undefined
	let centerY: number | undefined
	let angle: number
	let hover: boolean = false
	$: transform = `rotate(${angle ? angle : 0})`
	$: transformInv = `rotate(${angle ? 360 - angle : 0})`

	function setMarker(event: MouseEvent) {
		if (marker) {
			const x = event.clientX - centerX
			const y = event.clientY - centerY
			const theta = Math.atan2(y, x)
			angle = (theta * 180) / Math.PI + 360
		}
	}

	$: {
		if (marker) {
			markerRect = marker.getBoundingClientRect()
			R = markerRect.width / 2
			centerX = markerRect.left + R
			centerY = markerRect.top + R
		}
	}
</script>

<svelte:window on:mousemove={(event) => setMarker(event)} />

<div class="menu" transition:fade={{ duration: 600 }}>
	<div class="container">
		<div class="logo">
			<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 249">
				<g fill="RGB(250, 220, 233)" fill-rule="nonzero" id="group_artwork">
					<path
						id="body"
						d="M137.8,108c15.6-8.5,26.2-25,26.2-44c0-27.6-22.4-50-50-50H14v94H0v127h180V108H137.8z M114,221H14V121h100
        c27.6,0,50,22.4,50,50S141.6,221,114,221z"
					/>
				</g>
				<g stroke="RGB(135, 117, 125)" fill="none" stroke-width="6">
					<circle
						class="circle"
						class:circle-transform-cw={hover}
						bind:this={marker}
						cx="127"
						cy="64"
						r="27"
						stroke-dasharray="4.71238898038469"
						stroke-dashoffset="4.71238898038469"
						{transform}
					/>
					<circle
						class="circle"
						class:circle-transform-ccw={hover}
						cx="127"
						cy="64"
						r="21"
						stroke-dasharray="3.6651914291880923"
						stroke-dashoffset="0"
						transform={transformInv}
					/>
					<circle
						class="circle"
						class:circle-transform-cw={hover}
						cx="127"
						cy="64"
						r="15"
						stroke-dasharray="2.617993877991494"
						stroke-dashoffset="2.617993877991494"
						{transform}
					/>
					<circle
						class="circle"
						class:circle-transform-ccw={hover}
						cx="127"
						cy="64"
						r="9"
						stroke-dasharray="1.5707963267948966"
						stroke-dashoffset="0"
						stroke-width="6"
						transform={transformInv}
					/>
					<circle
						class="circle"
						class:circle-transform-cw={hover}
						cx="127"
						cy="64"
						r="3"
						stroke-dasharray="0.5235987755982988"
						stroke-dashoffset="0.5235987755982988"
						{transform}
					/>
				</g>
			</svg>
		</div>
		<div class="menu-items">
			<ul class="chapters">
				{#each [...$slideData.entries()] as [chapter, slideshows]}
					{#each [...slideshows.entries()] as [slideshow, [{ frontmatter }]]}
						{#if !frontmatter.meta.hidden}
							{#if frontmatter.meta.chapter}
								{#if frontmatter.meta.link}
									<li class="slideshow">
										<a on:click={toggleMenu} on:click={() => (hover = true)} href="#/{chapter}"
											>{frontmatter.meta.heading}</a
										>
									</li>
								{:else}
									<li class="chapter">
										{frontmatter.meta.heading}
									</li>
								{/if}
							{:else}
								<li class="slideshow">
									<a
										on:click={toggleMenu}
										on:click={() => (hover = true)}
										href="#/{chapter}/{slideshow}/1">{frontmatter.meta.heading}</a
									>
								</li>
							{/if}
						{/if}
					{/each}
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	.menu {
		grid-column: 1 / 5;
		grid-row: 1 / 3;
		background-color: rgba(0, 0, 0, 0.7);
		padding: 3rem 1rem 1rem 1rem;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		z-index: 5;
		display: flex;
		line-height: 1.3;
		color: white;
	}
	.container {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		height: 100%;
	}
	a {
		color: white;
		text-decoration: none;
	}
	a:hover {
		color: rgba(255, 0, 255, 1.0);
		text-decoration: none;
	}
	.logo {
		order: 1;
		height: 100%;
		width: 50%;
		& svg {
			width: 100%;
			height: 100%;
		}
	}
	.menu-items {
		order: 2;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 50%;
		margin: 0;
		font-size: 1.2rem;
	}
	.circle {
		transform-origin: 127px 64px;
	}
	@keyframes rotation {
		0% {
			transform: rotate(-360deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	@keyframes rotation-ccw {
		0% {
			transform: rotate(360deg);
		}
		100% {
			transform: rotate(-360deg);
		}
	}
	.circle-transform-cw {
		animation: rotation 8s linear infinite;
	}
	.circle-transform-ccw {
		animation: rotation-ccw 8s linear infinite;
	}
	ul.chapters {
		margin: 0;
		padding: 0;
		list-style-type: none;
	}
	.chapter {
		padding: 1rem 0;
		color: lightgray;
	}
	.slideshow {
		padding-left: 1rem;
	}
	@media all and (max-width: 700px) {
		ul.chapters {
			margin-top: 1rem;
		}
		.menu-items {
			order: 1;
			height: auto;
			width: 100%;
		}
		.logo {
			order: 2;
			height: auto;
			width: 100%;
		}
	}
</style>
