const settings = {
	// Overview text
	controlText: 'Select a location on the map',
	// Chapter settings
	chapterStyles: {
		default: {
			textColor: 'rgb(53, 110, 79)',
			// Can only be black or white!
			buttons: 'white'
		},
		argumentation: {
			textColor: 'rgb(53, 110, 79)'
		},
		documentation: {
			textColor: 'rgb(119, 63, 63)'
		},
		installation: {
			textColor: 'rgb(53, 110, 79)'
		}
	},
	// Show side panel
	panel: false,
	// Default Styles for Vector Features
	vectorFeatures: {
		// Default (without href or link property)
		default: {
			stroke: {
				color: 'rgba(255, 255, 0, 1)',
				width: 2
			},
			fill: {
				color: 'rgba(255, 255, 0, 0)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 255, 0, 1)',
				stroke: {
					color: 'rgba(255, 255, 0, 0)',
					width: 4
				}
			}
		},
		// Selectable features (with href or link property)
		selectable: {
			stroke: {
				color: 'yellow',
				width: 4
			},
			fill: {
				color: 'rgba(255, 255, 255, 0)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 255, 0, 1)',
				stroke: {
					color: 'rgba(255, 255, 255, 0)',
					width: 4
				}
			}
		},
		// On hover
		selected: {
			stroke: {
				color: 'rgba(255, 255, 0, 1)',
				width: 2
			},
			fill: {
				color: 'rgba(255, 255, 0, 1)'
			},
			point: {
				radius: 6,
				fill: 'rgba(255, 255, 0, 1)',
				stroke: {
					color: 'rgba(255, 255, 0, 1)',
					width: 4
				}
			}
		}
	}
}

export default settings
