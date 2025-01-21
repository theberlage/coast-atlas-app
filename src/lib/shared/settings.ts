const settings = {
	// Overview text
	controlText: 'Click a point on the map',
	// Chapter settings
	chapterStyles: {
		default: {
			textColor: 'rgba(45, 53, 140, 1.0)',
			// Can only be black or white!
			buttons: 'white'
		},
		argumentation: {
			textColor: 'rgba(45, 53, 140, 1.0)'
		},
		documentation: {
			textColor: 'rgba(45, 53, 140, 1.0)'
		},
		installation: {
			textColor: 'rgba(45, 53, 140, 1.0)'
		}
	},
	// Show side panel
	panel: false,
	// Default Styles for Vector Features
	vectorFeatures: {
		// Default (without href or link property)
		default: {
			stroke: {
				color: 'rgba(255, 0, 255, 1.0)',
				width: 2
			},
			fill: {
				color: 'rgba(255, 0, 255, 1.0)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 0, 255, 1.0)',
				stroke: {
					color: 'rgba(255, 0, 255, 1.0)',
					width: 4
				}
			}
		},
		// Selectable features (with href or link property)
		selectable: {
			stroke: {
				color: 'rgba(255, 0, 255, 1.0)',
				width: 4
			},
			fill: {
				color: 'rgba(255, 0, 255, 1.0)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 0, 255, 1.0)',
				stroke: {
					color: 'rgba(255, 0, 255, 1.0)',
					width: 4
				}
			}
		},
		// On hover
		selected: {
			stroke: {
				color: 'rgba(255, 0, 255, 1.0)',
				width: 2
			},
			fill: {
				color: 'rgba(255, 0, 255, 1.0)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 0, 255, 1.0)',
				stroke: {
					color: 'rgba(255, 0, 255, 1.0)',
					width: 4
				}
			}
		}
	}
}

export default settings
