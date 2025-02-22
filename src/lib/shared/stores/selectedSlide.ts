import { readable, writable, derived, get } from 'svelte/store'
import { slideData } from '$lib/shared/stores/markdownSlides.js'
import { fetchJson } from '$lib/shared/utils.js'
import settings from '../settings.js'

export let selectedChapter = writable<string | undefined>(undefined)
export let selectedSlideShow = writable<string | undefined>(undefined)
export let selectedSlideIndex = writable<number>(0)

const selectedChapterData = derived(
	[slideData, selectedChapter],
	([$slideData, $selectedChapter]) => {
		if ($selectedChapter) {
			return $slideData.get($selectedChapter)
		}
	}
)

export const black = derived(selectedChapter, ($selectedChapter) => {
	const setting =
		settings.chapterStyles[$selectedChapter]?.buttons || settings.chapterStyles.default.buttons
	if (setting === 'black') {
		return true
	} else return false
})

export const textColor = derived(selectedChapter, ($selectedChapter) =>
	$selectedChapter && settings.chapterStyles[$selectedChapter]?.textColor
		? settings.chapterStyles[$selectedChapter].textColor
		: settings.chapterStyles.default.textColor
)

const selectedSlideShowData = derived(
	[selectedChapterData, selectedSlideShow],
	([$selectedChapterData, $selectedSlideShow]) => {
		if ($selectedChapterData && $selectedSlideShow) {
			return $selectedChapterData.get($selectedSlideShow)
		}
	}
)

export const selectedSlideShowCount = derived(selectedSlideShowData, ($selectedSlideShowData) => {
	if ($selectedSlideShowData) return $selectedSlideShowData.length
})

export const overview = derived(selectedSlideShowCount, ($selectedSlideShowCount) => {
	if ($selectedSlideShowCount && $selectedSlideShowCount === 1) {
		// if (
		// $selectedSlideShow === 'home' ||
		// $selectedSlideShow === 'overview' ||
		// $selectedSlideShow === 'slide'
		// )
		return true
	} else return false
})

// Data for the current slide
// First value is undefined
export const selectedSlideData = derived(
	[slideData, selectedChapter, selectedSlideShow, selectedSlideIndex],
	([$slideData, $selectedChapter, $selectedSlideShow, $selectedSlideIndex]) => {
		// First value of selectedChapter is undefined
		if ($selectedChapter) {
			const chapterData = $slideData.get($selectedChapter)
			// First value of selectedSlideShow is undefined
			if ($selectedSlideShow && chapterData) {
				const slideshowData = chapterData.get($selectedSlideShow)
				if (slideshowData) {
					return slideshowData[$selectedSlideIndex]
				}
			}
		}
	}
)

const processAnnotation = (annotation: any, metadata: any) => {
	annotation.properties = {
		transformation: metadata.transformation,
		opacity: metadata.opacity,
		saturation: metadata.saturation,
		colorize: metadata.colorize,
		removeBackground: {
			color: metadata.removeBackground?.color,
			threshold: metadata.removeBackground?.threshold,
			hardness: metadata.removeBackground?.hardness
		}
	}
}

// Fetch georeference annotations of selected slide
// Initial value is undefined
// https://www.reddit.com/r/sveltejs/comments/tetq8w/what_is_a_good_practise_for_fetching_data_and/
// https://svelte.dev/docs/svelte-store#derived
export const georefAnnotations = derived(selectedSlideData, ($selectedSlideData, set) => {
	if ($selectedSlideData && $selectedSlideData.frontmatter?.allmaps?.length) {
		const resp = $selectedSlideData.frontmatter?.allmaps
			// Remove items without annotation filename
			.filter((item) => item.filename)
			// Reverse array to make sure layers are added in the right order
			.reverse()
			// Create an array of promises to fetch the jsons while keeping the metadata
			.map((item) => {
				const path = $selectedSlideData.path + 'allmaps/' + item.filename
				return fetchJson(path).then((resp) => ({ ...item, resp }))
			})
		// Map of individual annotations (that can be used to check for existing maps)
		Promise.all(resp).then((data) => {
			const map = new Map()
			for (const item of data) {
				if (item.resp.type === 'Annotation') {
					// Single annotation
					processAnnotation(item.resp, item)
					map.set(item.resp.id, item.resp)
				} else {
					// AnnotationPage
					for (const annotation of item.resp.items) {
						processAnnotation(annotation, item)
						map.set(annotation.id, annotation)
					}
				}
			}
			set(map)
		})
		// Set to empty map if there're no annotations for the current slide
	} else if ($selectedSlideData) {
		set(new Map())
	}
})

const processFeature = (feature: any, metadata: any) => {
	const properties = feature.properties
	// Delete id property in case of duplicate ids
	delete feature.id
	// Add geojson path to each feature to check for existing features
	feature.properties.collection = metadata.path
	// Replace for the lines below to add labels from the frontmatter
	properties.label = properties?.label || properties?.name || metadata.label
	// Parse Felt colors
	if ('felt:color' in properties) {
		properties.fill = properties['felt:color']
		properties.stroke = properties['felt:color']
	}
	if ('felt:fillOpacity' in properties) {
		properties['fill-opacity'] = properties['felt:fillOpacity']
	}
	// if ('felt:strokeOpacity' in properties) {
	// 	properties['stroke-opacity'] = properties['felt:fillOpacity']
	// }
	if ('felt:strokeWidth' in properties) {
		properties['stroke-width'] = properties['felt:strokeWidth']
	}
	const strokeStyle = properties['felt:strokeStyle']
	if (strokeStyle === 'dashed') {
		properties.strokeStyle = [4, 8]
	} else if (strokeStyle === 'dotted') {
		properties.strokeStyle = [0, 4]
	}
}

// Fetch geojsons of selected slide
// Initial value is undefined
export const vectorLayers = derived(selectedSlideData, ($selectedSlideData, set) => {
	if ($selectedSlideData) {
		if ($selectedSlideData.frontmatter?.geojson?.length) {
			const resp = $selectedSlideData.frontmatter?.geojson
				.filter((item) => item.filename)
				.map((item) => {
					const path = $selectedSlideData.path + 'felt/' + item.filename
					return fetchJson(path).then((resp) => ({ ...item, resp, path }))
				})
			Promise.all(resp).then((data) => {
				const map = new Map()
				for (const item of data) {
					if (item.resp.type === 'Feature') {
						processFeature(item.resp, item)
					} else {
						for (const feature of item.resp.features) {
							processFeature(feature, item)
						}
					}
					map.set(item.path, item.resp)
				}
				set(map)
			})
			// Set to empty map if there're no geojsons for the current slide
		} else if ($selectedSlideData) {
			set(new Map())
		}
	}
})

// Settings for mapbox layer taken from first slide of chapter
export const mapBoxLayer = derived(
	[slideData, selectedChapter],
	([$slideData, $selectedChapter]) => {
		if ($selectedChapter) {
			const chapterData = $slideData.get($selectedChapter)
			if (chapterData) {
				const firstSlide = chapterData.entries().next().value[1][0].frontmatter.mapbox
				return firstSlide
			}
		}
	}
)

// Uncomment for debugging

// selectedChapter.subscribe((value) => {
// 	console.log('selectedChapter', value)
// })

// selectedSlideShow.subscribe((value) => {
// 	console.log('selectedSlideShow', value)
// })

// selectedSlideIndex.subscribe((value) => {
// 	console.log('selectedSlideIndex', value)
// })

// selectedSlideShowCount.subscribe((value) => {
// 	console.log('slideShowCount', value)
// })

// selectedSlideData.subscribe((value) => {
// 	console.log('selectedSlideData', value)
// })

// georefAnnotations.subscribe((value) => {
// 	console.log('georefAnnotations', value)
// })

// vectorLayers.subscribe((value) => {
// 	console.log('vectorLayers', value)
// })

// mapBoxLayer.subscribe((value) => {
// 	console.log('mapBoxLayer', value)
// })
