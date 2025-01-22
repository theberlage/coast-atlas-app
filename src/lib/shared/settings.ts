const settings = {
	// Overview text
	controlText: 'Click a point on the map',
	highlightColor: 'rgba(255, 0, 255, 1)',
	// Map
	map: {
		backgroundColor: 'rgba(45, 53, 140, 1)',
		overlayBackgroundColor: 'rgba(255, 0, 255, 1)',
		overlayTextColor: 'rgba(255, 255, 255, 1)'
	},
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
				// Uses stroke and fill settings above
				radius: 10
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
				radius: 10,
				fill: 'rgba(255, 0, 255, 1.0)',
				stroke: {
					color: 'rgba(255, 255, 255, 1.0)',
					width: 2
				}
			}
		}
	}
}

export default settings
