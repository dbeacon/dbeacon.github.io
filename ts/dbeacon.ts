/// <reference path="../node_modules/@types/mapbox-gl/index.d.ts" />

enum Platform { MOBILE, TABLET, DESKTOP }
enum NavMode { NONE, AUTO, MANUAL, BEACON, LOCATE, NAVIGATE, VISUALIZE }

class DBeacon {

	static map_token = "pk.eyJ1Ijoia2VucmVpbGx5IiwiYSI6ImNrbGR5c3o4cDA4bTAyd3FsY3pwanQ1YWkifQ.MoUKfLotk49_Z2QgtR0v6A"
	static style_url = 'mapbox://styles/kenreilly/ckle0a9ay0oso18o1zqidsr39'

	static map_element: HTMLElement
	static map: mapboxgl.Map

	// static compass: HTMLElement
	// static compass_container: HTMLElement
	static readout_top: HTMLElement = document.querySelector('#readout-top')
	static control_row: HTMLElement = document.querySelector('#control-row')

	static inspector_visible = false
	static heading_lock = false
	static ready = true

	static nav_mode: NavMode = NavMode.NONE
	static default_zoom = 16

	static locator_marker: mapboxgl.Marker

	static icons: { [name: string]: HTMLElement } = {		
		beacon: document.querySelector('#beacon-icon'),
		locator: document.querySelector('#locator-icon'),
		compass: document.querySelector('#compass-icon')
	}

	static controls: { [name: string]: HTMLElement } = {
		settings: DBeacon.control_row.querySelector('.settings'),
		locator: DBeacon.control_row.querySelector('.locator'),
		compass: DBeacon.control_row.querySelector('.compass'),
		compass_svg: DBeacon.control_row.querySelector('.compass > img'),
		avatar: DBeacon.control_row.querySelector('.avatar'),
		beacon: DBeacon.control_row.querySelector('.beacon')
	}
	
	static init() {

		window['dbeacon'] = DBeacon
		DBeacon.init_worker()

		// DBeacon.compass_container = document.querySelector('#compass-container')
		
		// DBeacon.compass = DBeacon.compass_container.querySelector('img')
		DBeacon.controls.compass.onclick = DBeacon.on_click_compass
		DBeacon.controls.compass.ondblclick = DBeacon.on_dblclick_compass
		DBeacon.controls.compass.ondragstart = DBeacon.on_dragstart_compass
		DBeacon.controls.settings.onclick = DBeacon.on_click_settings

		DBeacon.init_map()
		window.ondeviceorientation = DBeacon.on_device_orientation
	}

	static init_worker() {
		
		if (!navigator.serviceWorker) return;
		try { navigator.serviceWorker.register('build/worker.js', { scope: '/build/' }) }
		catch (e) {}
	}

	static auto() {

		if (DBeacon.inspector_visible) { DBeacon.clear_inspector() }
		
		DBeacon.locate()
		DBeacon.map.setZoom(DBeacon.default_zoom)
		DBeacon.nav_mode = NavMode.AUTO
	}

	static locate = () => navigator.geolocation.getCurrentPosition(DBeacon.on_position, DBeacon.on_error)

	static init_map() {

		try {
			DBeacon.map_element = document.querySelector('#map')
			DBeacon.map = new mapboxgl.Map({
				accessToken: DBeacon.map_token,
				style: DBeacon.style_url,
				container: 'map'
			})

			DBeacon.map.on('style.load', DBeacon.on_load_style)
			DBeacon.map.on('rotate', DBeacon.on_rotate)
			DBeacon.map.on('pitch', DBeacon.on_pitch)
			DBeacon.map.on('touchstart', DBeacon.on_touch_start)
			DBeacon.map.on('touchend', DBeacon.on_touch_end)			

			DBeacon.auto()
		}
		catch (e) { console.log(e) }
	}

	static get settings_open (): boolean { return DBeacon.control_row.classList.contains('open') }

	static on_click_settings = () => {
		DBeacon.control_row.classList[DBeacon.settings_open ? 'remove' : 'add']('open')
		DBeacon.control_row.classList[DBeacon.settings_open ? 'remove' : 'add']('closed')
	}

	static on_load_style = () => DBeacon.map.on('click', (e) => DBeacon.on_click_map(e))
	
	static on_click_map = (ev: mapboxgl.MapMouseEvent) => {

		if (DBeacon.inspector_visible) { DBeacon.clear_inspector() }

		let features: mapboxgl.MapboxGeoJSONFeature[] = DBeacon.map.queryRenderedFeatures(ev.point)
		if (!features.length) return
		ev.preventDefault()
		
		try {
			let coords: mapboxgl.LngLatLike = features[0].geometry['coordinates']
			DBeacon.locator_marker = new mapboxgl.Marker({ element: DBeacon.icons.locator })
			DBeacon.locator_marker.setLngLat(coords).setPitchAlignment('map').addTo(DBeacon.map)
			DBeacon.map.flyTo({ animate: true, center: coords })
			DBeacon.render_feature(features[0])
		}
		catch (e) { }
	}

	static clear_inspector() {
		
		DBeacon.locator_marker.remove()
		DBeacon.readout_top.innerHTML = null
		DBeacon.readout_top.classList.remove('visible')
		DBeacon.inspector_visible = false
	}

	static render_feature(feature: mapboxgl.MapboxGeoJSONFeature) {

		let h2 = document.createElement('h2')
		h2.innerHTML = feature.properties.name
		DBeacon.readout_top.appendChild(h2)

		let h3 = document.createElement('h3')
		h3.innerHTML = '(' + feature.properties.type + ')'
		DBeacon.readout_top.appendChild(h3)

		DBeacon.readout_top.classList.add('visible')
		DBeacon.inspector_visible = true
	}
 
	static on_position(position: GeolocationPosition) {

		if (!DBeacon.map) return
		let coords = { lat: position.coords.latitude, lon: position.coords.longitude }
		
		try {

			let opts: mapboxgl.MarkerOptions = { 				
				pitchAlignment: 'map',
				rotationAlignment: 'map'
			}

			let marker = new mapboxgl.Marker({ ...opts, element: DBeacon.icons.compass })
			let spinner = new mapboxgl.Marker({ ...opts, element: DBeacon.icons.locator })
			
			marker.getElement().onclick = DBeacon.on_click_self.bind(null, marker)
			marker.setLngLat(coords)
			marker.addTo(DBeacon.map)

			spinner.setLngLat(coords)
			spinner.addTo(DBeacon.map)

		} catch (e) { }
				
		DBeacon.map.setCenter(coords)
		DBeacon.map.rotateTo(0)
	}

	static on_error() {

	}

	static on_touch_start() {

		DBeacon.ready = false
		DBeacon.nav_mode = NavMode.MANUAL
		if (DBeacon.inspector_visible) { DBeacon.clear_inspector() }
	}

	static on_touch_end() {

		DBeacon.ready = true
	}

	static on_rotate(event: any) {
		
		var bearing: number = 360 - event.target.getBearing()
		DBeacon.controls.compass_svg.style.setProperty('--angle', bearing.toFixed(1).toString() + 'deg')
	}

	static on_pitch(event: any) {

		var pitch: number = (event.target.getPitch() * .9)
		DBeacon.controls.compass.style.setProperty('--pitch', pitch.toFixed(1).toString() + 'deg')
	}

	static on_click_compass() {

		// DBeacon.map.rotateTo(0)
		// DBeacon.heading_lock = !DBeacon.heading_lock
		DBeacon.auto()
	}

	static on_dblclick_compass() {
		
		// DBeacon.auto()
	}

	static on_dragstart_compass(event: any) {
		debugger
	}

	static on_device_orientation(event: DeviceOrientationEvent) {
		
		if (!DBeacon.ready || DBeacon.nav_mode != NavMode.AUTO) return
		window.requestAnimationFrame(() => DBeacon.map.setBearing(360 - event.alpha))
		window.requestAnimationFrame(() => DBeacon.map.setPitch(event.beta))
		// DBeacon.map.setCenter({ lat:  })
	}

	static on_click_self(marker: mapboxgl.Marker) {
		
		var coords = marker.getLngLat()
		DBeacon.map.flyTo({ animate: true, center: coords })
	}
}

window.onload = DBeacon.init