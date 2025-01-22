import { Fill, Stroke, Circle, Style } from 'ol/style.js'
import { hexToRGBA } from './utils.js'
import settings from './settings.js'

const defaults = settings.vectorFeatures

export const defaultStyles = new Style({
	stroke: new Stroke({
		color: defaults.default.stroke.color,
		width: defaults.default.stroke.width
	}),
	fill: new Fill({
		color: defaults.default.fill.color
	})
})

export const selectedStyles = new Style({
	stroke: new Stroke({
		color: defaults.selected.stroke.color,
		width: defaults.selected.stroke.width
	}),
	fill: new Fill({
		color: defaults.selected.fill.color
	}),
	image: new Circle({
		radius: defaults.selected.point.radius,
		fill: new Fill({ color: defaults.selected.point.fill }),
		stroke: new Stroke({
			color: defaults.selected.point.stroke.color,
			width: defaults.selected.point.stroke.width
		})
	})
	// zIndex: 5
})

// export const selectableStyles = new Style({
// 	stroke: new Stroke({
// 		color: defaults.selectable.stroke.color,
// 		width: defaults.selectable.stroke.width
// 	}),
// 	fill: new Fill({
// 		color: defaults.selectable.fill.color
// 	}),
// 	image: new Circle({
// 		radius: defaults.selectable.point.radius,
// 		fill: new Fill({ color: defaults.selectable.point.fill }),
// 		stroke: new Stroke({
// 			color: defaults.selectable.point.stroke.color,
// 			width: defaults.selectable.point.stroke.width
// 		})
// 	}),
// 	zIndex: 4
// })

export function parseCustomFeatureStyle(properties) {
	let fillOpacity = 'fill-opacity' in properties ? properties['fill-opacity'] : 1
	let strokeOpacity = 'stroke-opacity' in properties ? properties['stroke-opacity'] : 1
	let fillColor =
		properties.fill && properties.fill.includes('rgba')
			? properties.fill
			: properties.fill && properties.fill.includes('#')
			? hexToRGBA(properties.fill, fillOpacity)
			: settings.vectorFeatures.default.fill.color
	let strokeColor =
		properties.stroke && properties.stroke.includes('rgba')
			? properties.stroke
			: properties.stroke && properties.stroke.includes('#')
			? hexToRGBA(properties.stroke, strokeOpacity)
			: settings.vectorFeatures.default.stroke.color
	let strokeWidth =
		'stroke-width' in properties
			? properties['stroke-width']
			: settings.vectorFeatures.default.stroke.width
	let radius =
		'radius' in properties ? properties.radius : settings.vectorFeatures.default.point.radius
	let lineDash = 'strokeStyle' in properties ? properties.strokeStyle : null
	return new Style({
		stroke: new Stroke({
			color: strokeColor,
			width: strokeWidth,
			lineDash
		}),
		fill: new Fill({
			color: fillColor
		}),
		image: new Circle({
			radius,
			fill: new Fill({ color: fillColor }),
			stroke: new Stroke({
				color: strokeColor,
				width: strokeWidth
			})
		})
	})
}
