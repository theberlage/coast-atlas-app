<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	// Stores and settings
	import {
		mapBoxLayer as mapboxSettings,
		selectedSlideData as selectedSlide,
		georefAnnotations as newWarpedMapSource,
		vectorLayers as newVectorSource,
		black,
		textColor,
		overview,
		selectedChapter as chapter
	} from '$lib/shared/stores/selectedSlide.js'
	import { panel } from '$lib/shared/stores/componentStates.js'
	import { close } from '$lib/shared/svgs.js'
	import settings from '$lib/shared/settings.js'

	// Shared functions
	import { calculateExtent, sleep, hexToRGBA, stringToHTML } from '$lib/shared/utils.js'

	// Open Layers
	import olMap from 'ol/Map'
	import olView from 'ol/View'
	import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
	import { OSM, XYZ, Vector as VectorSource } from 'ol/source.js'
	import { Rotate, Zoom, Control, defaults as defaultControls } from 'ol/control.js'
	import Collection from 'ol/Collection.js'
	import { getCenter } from 'ol/extent'
	import GeoJSON from 'ol/format/GeoJSON.js'
	import { Fill, Stroke, Circle, Style, Icon } from 'ol/style.js'
	import { MapboxVectorLayer } from 'ol-mapbox-style'
	import { fromExtent } from 'ol/geom/Polygon'
	import Point from 'ol/geom/Point.js'
	import Feature from 'ol/Feature.js'
	import { unByKey } from 'ol/Observable'
	import Overlay from 'ol/Overlay.js'
	import { toLonLat } from 'ol/proj.js'
	import { toStringHDMS } from 'ol/coordinate.js'

	// Types & CSS
	import type { Extent, Coordinate } from 'ol/extent'
	import type { EventsKey } from 'ol/events'
	import 'ol/ol.css'

	// Vector styles and svg
	import {
		defaultStyles,
		selectedStyles,
		parseCustomFeatureStyle
	} from '$lib/shared/vectorStyles.js'
	import { plus, minus, arrowUp, berlage } from '$lib/shared/svgs.js'

	// Allmaps
	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	let map: olMap
	let view: olView

	let xyzSource: XYZ
	let xyzLayer: TileLayer<XYZ>

	let warpedMapLayer: WarpedMapLayer
	let warpedMapSource: WarpedMapSource

	let vectorSource: VectorSource
	let vectorLayer: VectorLayer<VectorSource>

	let mapBoxLayer: MapboxVectorLayer

	let currentXyzSource: string | undefined = undefined
	let currentWarpedMapSource = new Map()
	let currentVectorSource = new Map()
	let animating: boolean = false
	let extent: Extent

	let pointerMoveKey: EventsKey | undefined = undefined
	let singleClickKey: EventsKey | undefined = undefined
	let overlayKey: EventsKey | undefined = undefined

	let innerWidth: number

	let overlay: Overlay
	let overlayBoolean: boolean = false
	let overlayElement: HTMLElement
	let overlayContents: any

	$: home = $chapter === 'home' ? true : false

	const addControls = () => {
		const collection = new Collection()
		const zoomIn = new Zoom({
			zoomInLabel: stringToHTML(plus),
			zoomOutLabel: stringToHTML(minus),
			target: 'controls',
			className: 'zoom'
		})
		const rotate = new Rotate({
			label: stringToHTML(arrowUp),
			target: 'controls',
			className: 'rotate'
		})
		collection.extend([zoomIn, rotate])
		return collection
	}

	const closeOverlay = () => {
		overlayBoolean = false
		// overlay.setPosition(undefined)
	}

	// $: {
	// 	if (view) {
	// 		map.on('moveend', () => {
	// 			console.log(view.getZoom(), toLonLat(view.getCenter()))
	// 		})
	// 	}
	// }

	// Add Mapbox background layer
	$: {
		if (map && $mapboxSettings) {
			if (mapBoxLayer) {
				map.removeLayer(mapBoxLayer)
			}
			mapBoxLayer = new MapboxVectorLayer({
				styleUrl: $mapboxSettings.styleUrl,
				accessToken: $mapboxSettings.accessToken
			})
			map.getLayers().extend([mapBoxLayer])
			console.log('Added Mapbox layer')
		}
	}

	$: {
		// Todo: use view.fit(extent, {padding, duration})
		// https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#fit
		if (view && innerWidth > 700) {
			view.padding = $panel ? [0, 400, 0, 0] : [0, 0, 0, 0]
		} else if (view) {
			view.padding = [0, 0, 0, 0]
		}
	}

	// Add optional XYZ layer and animate the view
	$: {
		if (map && $selectedSlide) {
			const settings = $selectedSlide.frontmatter
			extent = calculateExtent(settings.viewer.bbox)
			const center: Coordinate = getCenter(extent)
			const resolution: number = view.getResolutionForExtent(extent, map.getSize())
			const rotation: number = settings.viewer.rotation * (Math.PI / 180)
			const duration: number = 1000

			// Add/remove XYZ layer
			if (settings.xyz?.url) {
				const url = settings.xyz.url
				if (currentXyzSource && currentXyzSource !== url) {
					// Replace XYZ layer
					xyzSource.setUrl('')
					xyzSource.clear()
					xyzSource.setUrl(url)
					console.log('Changed XYZ layer')
				} else if (currentXyzSource === url) console.log('Existing XYZ layer')
				else {
					xyzSource.setUrl(url)
					console.log('Added XYZ layer')
				}
				if (url.includes('https://allmaps.xyz/')) {
					console.warn(
						'Allmaps XYZ tile proxy is used; please add the map as a Georeference Annotation',
						url
					)
				}
				currentXyzSource = url
			} else if (currentXyzSource) {
				// Remove XYZ layer
				xyzSource.setUrl('')
				xyzSource.clear()
				currentXyzSource = undefined
				console.log('Removed XYZ layer')
			}

			// Animate view
			animateView(center, resolution, rotation, duration)
		}
	}

	// Add Allmaps layers
	$: {
		// Add && !animating to wait for animation
		if (warpedMapLayer && $newWarpedMapSource) {
			if ($newWarpedMapSource.size) {
				addWarpedMapSource($newWarpedMapSource)
			} else {
				warpedMapSource.clear()
				currentWarpedMapSource = new Map()
				console.log('All maps removed')
			}
			// console.log('Processed maps')
		}
	}

	// Add vector layers
	$: {
		// Add && !animating to wait for animation
		if (vectorLayer && $newVectorSource) {
			// Remove overlays
			closeOverlay()
			if ($newVectorSource.size) {
				addVectorSource($newVectorSource)
			} else {
				vectorSource.clear()
				currentVectorSource = new Map()
				console.log('All features removed')
			}
			// console.log('Processed features')
		}
	}

	function animateView(center: Coordinate, resolution: number, rotation: number, duration: number) {
		view.animate({
			center,
			resolution,
			rotation,
			duration
		})
		// To determine if view is animating (and only add layers after animation)
		if (view.getAnimating) {
			animating = true
			setTimeout(() => (animating = false), duration)
		}
	}

	async function addWarpedMapSource(newWarpedMapSource: any) {
		let removedCount = 0
		let addedCount = 0
		let existingCount = 0
		for (const [id, annotation] of currentWarpedMapSource) {
			// Remove maps from WarpedMapSource that are not on the new slide
			if (!newWarpedMapSource.has(id)) {
				// Trick because sometimes a removed map remains visible during animation
				warpedMapLayer.setMapOpacity(id, 0)
				warpedMapSource.removeGeoreferenceAnnotation(annotation)
				removedCount++
			}
		}
		for (const [id, annotation] of newWarpedMapSource) {
			const properties = annotation.properties
			// Only add new maps to WarpedMapSource
			if (!currentWarpedMapSource.has(id)) {
				// Use warpedMapLayer API after updating OL plugin
				const supportedTransformations = ['thinPlateSpline', 'helmert']
				if (supportedTransformations.includes(properties.transformation)) {
					annotation.body.transformation = {
						type: properties.transformation
					}
				}
				await warpedMapSource.addGeoreferenceAnnotation(annotation)
				addedCount++
			} else {
				// Move existing maps to front to follow new layer order
				warpedMapSource.bringMapsToFront([id])
				existingCount++
			}
			// Set properties
			if (properties.opacity !== undefined) {
				let opacity = properties.opacity / 100
				warpedMapLayer.setMapOpacity(id, opacity)
			} else {
				warpedMapLayer.resetMapOpacity(id)
			}
			if (properties.removeBackground?.color) {
				let hexColor = properties.removeBackground.color
				let threshold = properties.removeBackground.threshold
					? properties.removeBackground.threshold / 100
					: 0.1
				let hardness = properties.removeBackground.hardness
					? properties.removeBackground.hardness / 100
					: 0.7
				warpedMapLayer.setMapRemoveColor(id, { hexColor, threshold, hardness })
			} else {
				warpedMapLayer.resetMapRemoveColor(id)
			}
			if (properties.saturation !== undefined) {
				warpedMapLayer.setMapSaturation(id, properties.saturation / 100)
			} else {
				warpedMapLayer.resetMapSaturation(id)
			}
			if (properties.colorize) {
				warpedMapLayer.setMapColorize(id, properties.colorize)
			} else {
				warpedMapLayer.resetMapColorize(id)
			}
		}
		console.log(`Maps: ${removedCount} removed, ${addedCount} added, ${existingCount} existing`)
		currentWarpedMapSource = newWarpedMapSource
	}

	function addVectorSource(newVectorSource: any) {
		// Remove existing listeners
		if (pointerMoveKey && singleClickKey) {
			unByKey(pointerMoveKey)
			unByKey(singleClickKey)
			unByKey(overlayKey)
			// console.log('Removed listeners')
		}
		let removedCount = 0
		let addedCount = 0
		let existingCount = 0
		vectorSource.forEachFeature((feature) => {
			const id = feature.getProperties().collection
			// Remove vectors from VectorSource that are not on the new slide
			if (!newVectorSource.has(id)) {
				vectorSource.removeFeature(feature)
				removedCount++
			}
		})
		for (let [id, features] of newVectorSource) {
			// Only add new features to VectorSource
			if (!currentVectorSource.has(id)) {
				let parsedFeatures = new GeoJSON().readFeatures(features, {
					featureProjection: 'EPSG:3857'
				})
				vectorSource.addFeatures(parsedFeatures)
				addedCount++
			} else {
				existingCount++
			}
		}
		console.log(`Features: ${removedCount} removed, ${addedCount} added, ${existingCount} existing`)
		currentVectorSource = newVectorSource

		// Uncomment the block below to display the bbox of the view
		// let bboxPolygon = fromExtent(extent)
		// let bboxFeature = new Feature({
		// 	geometry: bboxPolygon,
		// 	'fill-opacity': 0
		// })
		// vectorSource.addFeature(bboxFeature)

		// Set properties
		let selectable = false
		vectorSource.forEachFeature(function (feature) {
			let properties = feature.getProperties()
			if (properties.label) {
				selectable = true
				// feature.setStyle(selectableStyles)

				// // Add Berlage icon for selectable items
				// const berlageIcon = new Style({
				// 	image: new Icon({
				// 		anchor: [0.5, 0.7],
				// 		anchorXUnits: 'fraction',
				// 		anchorYUnits: 'fraction',
				// 		scale: 0.08,
				// 		// src: 'data:image/svg+xml;base64,' + btoa(JSON.stringify(berlage))
				// 		src: 'assets/berlage-logo.png'
				// 	})
				// })
				// const center = getCenter(feature.getGeometry()?.getExtent())
				// const extraFeature = new Feature({
				// 	geometry: new Point(center)
				// })
				// extraFeature.setStyle(berlageIcon)
				// vectorSource.addFeature(extraFeature)
			}
			const customStyle = parseCustomFeatureStyle(properties)
			feature.setStyle(customStyle)
		})
		if (selectable) createListeners()
	}

	function createListeners() {
		pointerMoveKey = map.on('pointermove', function (event) {
			// https://stackoverflow.com/questions/60511753/why-isnt-openlayers-detecting-touch-events-from-my-laptop
			vectorLayer.getFeatures(event.pixel).then(function (features) {
				let feature = features.length && features[0]
				let properties = feature && feature.getProperties()

				// Reset styles
				vectorSource.forEachFeature(function (feature) {
					let properties = feature.getProperties()
					if (properties.link) {
						const customStyle = parseCustomFeatureStyle(properties)
						feature.setStyle(customStyle)
					}
				})
				map.getTargetElement().style.cursor = ''

				// Set styles
				if (properties?.label) {
					map.getTargetElement().style.cursor = 'pointer'
					if (properties.link) {
						feature.setStyle(selectedStyles)
					}
				}
			})
		})

		singleClickKey = map.on('singleclick', function (event) {
			vectorLayer.getFeatures(event.pixel).then(function (features) {
				const feature = features.length && features[0]
				if (feature) {
					const properties = feature.getProperties()
					if (properties.label) {
						map.getTargetElement().style.cursor = ''
						// const hdms = toStringHDMS(toLonLat(coordinate))
						overlayContents = properties
						const coordinate = event.coordinate
						overlay.setPosition(coordinate)
						overlayBoolean = true
						// console.log('Positioned overlay')
					} else closeOverlay()
				} else closeOverlay()
			})
		})

		// overlayKey = map.on('singleclick', function (event) {
		// 	const coordinate = event.coordinate
		// 	const hdms = toStringHDMS(toLonLat(coordinate))

		// 	overlayContents = '<p>You clicked here:</p><code>' + hdms + '</code>'
		// 	overlay.setPosition(coordinate)
		// 	console.log('Positioned overlay')
		// })

		// console.log('Added listeners')
	}

	onMount(async () => {
		// let osmLayer = new TileLayer({
		// 	source: new OSM(),
		// 	zIndex: 1
		// })

		xyzSource = new XYZ()
		xyzLayer = new TileLayer({
			source: xyzSource,
			zIndex: 2
		})

		warpedMapSource = new WarpedMapSource()
		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource,
			zIndex: 3
		})

		vectorSource = new VectorSource()
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: defaultStyles,
			zIndex: 4
		})

		overlay = new Overlay({
			element: overlayElement,
			offset: [15, 15],
			autoPan: {
				animation: {
					duration: 250
				}
			}
		})

		view = new olView()

		map = new olMap({
			view,
			layers: [xyzLayer, warpedMapLayer, vectorLayer],
			target: 'ol',
			overlays: [overlay],
			controls: addControls()
		})
	})
</script>

<svelte:window bind:innerWidth />

<div
	id="ol"
	class="map"
	style="--map-background: {settings.map.backgroundColor}; --overlay-background: {settings.map
		.overlayBackgroundColor}; --overlay-color: {settings.map.overlayTextColor}"
/>

<div id="overlay" bind:this={overlayElement}>
	{#if overlayBoolean}
		<div id="overlay-contents" transition:fade>
			<div id="overlay-closer">
				<button on:click={closeOverlay}><body>{@html close}</body></button>
			</div>
			<div id="overlay-content">
				{#if overlayContents}
					{#if overlayContents.link}
						<p>{overlayContents.label}</p>
						<p>
							{#if home}
								<p>
									<a
										class="overlay-link"
										on:click={closeOverlay}
										href={overlayContents['documentation-link']}
									>
										Open in Documentation
									</a>
								</p>
								<p>
									<a
										class="overlay-link"
										on:click={closeOverlay}
										href={overlayContents['argumentation-link']}
									>
										Open in Argumentation
									</a>
								</p>
								<p>
									<a
										class="overlay-link"
										on:click={closeOverlay}
										href={overlayContents['installation-link']}
									>
										Open in Installation
									</a>
								</p>
							{:else}
								<a class="overlay-link" on:click={closeOverlay} href={overlayContents.link}>
									{#if overlayContents['link-title']}
										{overlayContents['link-title']}
									{:else if $overview}
										Start slideshow
									{:else if overlayContents.link.includes('argumentation')}
										Go to slide
									{:else if overlayContents.link.includes('documentation')}
										Open in Documentation
									{/if}
								</a>
							{/if}
						</p>
					{:else}
						<p>{overlayContents.label}</p>
						<p>{overlayContents.description ? overlayContents.description : ''}</p>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<div id="controls" class:black={$black} style="--highlight: {settings.highlightColor}" />

<style>
	.map {
		grid-column: 1 / 5;
		grid-row: 1 / 3;
		background-color: var(--map-background);
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	#overlay {
		position: absolute;
		min-width: 270px;
		max-width: 700px;
		/* width: auto; */
	}

	#overlay-contents {
		background-color: var(--overlay-background);
		color: var(--overlay-color);
		padding: 0.6rem;
		line-height: 1.6rem;
		border-radius: 0.4rem;
		z-index: 100;
		& p {
			margin: 0;
		}
	}

	a.overlay-link {
		border-bottom: 1px solid WHITE;
		color: WHITE;
		&:hover {
			border-bottom: none;
		}
	}

	#overlay-closer {
		float: right;
		& button {
			background: none;
			display: block;
			border: none;
			color: WHITE;
			padding: 0;
			margin: 0;
			height: 1rem;
			width: 1rem;
			border-radius: 0.2rem;
			line-height: 0.4rem;
			& svg {
				height: 0.8rem;
				width: 0.8rem;
			}
			&:hover {
				background: rgba(0, 0, 0, 0.2);
			}
			&:active {
				background: rgba(0, 0, 0, 0.2);
			}
		}
	}

	/* #overlay:before {
		top: 50%;
		border: solid 10px transparent;
		content: ' ';
		border-right-color: yellow;
		height: 0;
		width: 0;
		position: absolute;
		pointer-events: none;
		left: 0px;
		margin-left: -20px;
		margin-top: -10px;
	} */

	#controls {
		grid-column: 1 / 2;
		grid-row: 2 / 3;
		z-index: 2;
		margin: 0.4rem 0 0 1rem;
		width: 2rem;
		align-self: start;
		& .ol-control {
			background: none;
			position: relative;
			& button {
				background: none;
				border: none;
				color: white;
				height: 2rem;
				width: 2rem;
				cursor: pointer;
				border-radius: 0.2rem;
				& svg {
					height: 1.5rem;
					width: 1.5rem;
				}
				&:hover {
					text-decoration: none;
					outline: none;
					color: var(--highlight);
					background: rgba(0, 0, 0, 0.2);
				}
			}
		}
	}

	.black {
		& .ol-control {
			& button {
				color: black;
			}
		}
	}

	@media all and (max-width: 500px) {
	}
</style>
