/// <reference path="../node_modules/@types/mapbox-gl/index.d.ts" />
var Platform;
(function (Platform) {
    Platform[Platform["MOBILE"] = 0] = "MOBILE";
    Platform[Platform["TABLET"] = 1] = "TABLET";
    Platform[Platform["DESKTOP"] = 2] = "DESKTOP";
})(Platform || (Platform = {}));
var NavMode;
(function (NavMode) {
    NavMode[NavMode["NONE"] = 0] = "NONE";
    NavMode[NavMode["AUTO"] = 1] = "AUTO";
    NavMode[NavMode["MANUAL"] = 2] = "MANUAL";
    NavMode[NavMode["BEACON"] = 3] = "BEACON";
    NavMode[NavMode["LOCATE"] = 4] = "LOCATE";
    NavMode[NavMode["NAVIGATE"] = 5] = "NAVIGATE";
    NavMode[NavMode["VISUALIZE"] = 6] = "VISUALIZE";
})(NavMode || (NavMode = {}));
class DBeacon {
    static init() {
        window['dbeacon'] = DBeacon;
        DBeacon.init_worker();
        // DBeacon.compass_container = document.querySelector('#compass-container')
        // DBeacon.compass = DBeacon.compass_container.querySelector('img')
        DBeacon.controls.compass.onclick = DBeacon.on_click_compass;
        DBeacon.controls.compass.ondblclick = DBeacon.on_dblclick_compass;
        DBeacon.controls.compass.ondragstart = DBeacon.on_dragstart_compass;
        DBeacon.controls.settings.onclick = DBeacon.on_click_settings;
        DBeacon.init_map();
        window.ondeviceorientation = DBeacon.on_device_orientation;
    }
    static init_worker() {
        if (!navigator.serviceWorker)
            return;
        try {
            navigator.serviceWorker.register('build/worker.js', { scope: '/build/' });
        }
        catch (e) { }
    }
    static auto() {
        if (DBeacon.inspector_visible) {
            DBeacon.clear_inspector();
        }
        DBeacon.locate();
        DBeacon.map.setZoom(DBeacon.default_zoom);
        DBeacon.nav_mode = NavMode.AUTO;
    }
    static init_map() {
        try {
            DBeacon.map_element = document.querySelector('#map');
            DBeacon.map = new mapboxgl.Map({
                accessToken: DBeacon.map_token,
                style: DBeacon.style_url,
                container: 'map'
            });
            DBeacon.map.on('style.load', DBeacon.on_load_style);
            DBeacon.map.on('rotate', DBeacon.on_rotate);
            DBeacon.map.on('pitch', DBeacon.on_pitch);
            DBeacon.map.on('touchstart', DBeacon.on_touch_start);
            DBeacon.map.on('touchend', DBeacon.on_touch_end);
            DBeacon.auto();
        }
        catch (e) {
            console.log(e);
        }
    }
    static get settings_open() { return DBeacon.control_row.classList.contains('open'); }
    static clear_inspector() {
        DBeacon.locator_marker.remove();
        DBeacon.readout_top.innerHTML = null;
        DBeacon.readout_top.classList.remove('visible');
        DBeacon.inspector_visible = false;
    }
    static render_feature(feature) {
        let h2 = document.createElement('h2');
        h2.innerHTML = feature.properties.name;
        DBeacon.readout_top.appendChild(h2);
        let h3 = document.createElement('h3');
        h3.innerHTML = '(' + feature.properties.type + ')';
        DBeacon.readout_top.appendChild(h3);
        DBeacon.readout_top.classList.add('visible');
        DBeacon.inspector_visible = true;
    }
    static on_position(position) {
        if (!DBeacon.map)
            return;
        let coords = { lat: position.coords.latitude, lon: position.coords.longitude };
        try {
            let opts = {
                pitchAlignment: 'map',
                rotationAlignment: 'map'
            };
            let marker = new mapboxgl.Marker(Object.assign(Object.assign({}, opts), { element: DBeacon.icons.compass }));
            let spinner = new mapboxgl.Marker(Object.assign(Object.assign({}, opts), { element: DBeacon.icons.locator }));
            marker.getElement().onclick = DBeacon.on_click_self.bind(null, marker);
            marker.setLngLat(coords);
            marker.addTo(DBeacon.map);
            spinner.setLngLat(coords);
            spinner.addTo(DBeacon.map);
        }
        catch (e) { }
        DBeacon.map.setCenter(coords);
        DBeacon.map.rotateTo(0);
    }
    static on_error() {
    }
    static on_touch_start() {
        DBeacon.ready = false;
        DBeacon.nav_mode = NavMode.MANUAL;
        if (DBeacon.inspector_visible) {
            DBeacon.clear_inspector();
        }
    }
    static on_touch_end() {
        DBeacon.ready = true;
    }
    static on_rotate(event) {
        var bearing = 360 - event.target.getBearing();
        DBeacon.controls.compass_svg.style.setProperty('--angle', bearing.toFixed(1).toString() + 'deg');
    }
    static on_pitch(event) {
        var pitch = (event.target.getPitch() * .9);
        DBeacon.controls.compass.style.setProperty('--pitch', pitch.toFixed(1).toString() + 'deg');
    }
    static on_click_compass() {
        // DBeacon.map.rotateTo(0)
        // DBeacon.heading_lock = !DBeacon.heading_lock
        DBeacon.auto();
    }
    static on_dblclick_compass() {
        // DBeacon.auto()
    }
    static on_dragstart_compass(event) {
        debugger;
    }
    static on_device_orientation(event) {
        if (!DBeacon.ready || DBeacon.nav_mode != NavMode.AUTO)
            return;
        window.requestAnimationFrame(() => DBeacon.map.setBearing(360 - event.alpha));
        window.requestAnimationFrame(() => DBeacon.map.setPitch(event.beta));
        // DBeacon.map.setCenter({ lat:  })
    }
    static on_click_self(marker) {
        var coords = marker.getLngLat();
        DBeacon.map.flyTo({ animate: true, center: coords });
    }
}
DBeacon.map_token = "pk.eyJ1Ijoia2VucmVpbGx5IiwiYSI6ImNrbGR5c3o4cDA4bTAyd3FsY3pwanQ1YWkifQ.MoUKfLotk49_Z2QgtR0v6A";
DBeacon.style_url = 'mapbox://styles/kenreilly/ckle0a9ay0oso18o1zqidsr39';
// static compass: HTMLElement
// static compass_container: HTMLElement
DBeacon.readout_top = document.querySelector('#readout-top');
DBeacon.control_row = document.querySelector('#control-row');
DBeacon.inspector_visible = false;
DBeacon.heading_lock = false;
DBeacon.ready = true;
DBeacon.nav_mode = NavMode.NONE;
DBeacon.default_zoom = 16;
DBeacon.icons = {
    beacon: document.querySelector('#beacon-icon'),
    locator: document.querySelector('#locator-icon'),
    compass: document.querySelector('#compass-icon')
};
DBeacon.controls = {
    settings: DBeacon.control_row.querySelector('.settings'),
    locator: DBeacon.control_row.querySelector('.locator'),
    compass: DBeacon.control_row.querySelector('.compass'),
    compass_svg: DBeacon.control_row.querySelector('.compass > img'),
    avatar: DBeacon.control_row.querySelector('.avatar'),
    beacon: DBeacon.control_row.querySelector('.beacon')
};
DBeacon.locate = () => navigator.geolocation.getCurrentPosition(DBeacon.on_position, DBeacon.on_error);
DBeacon.on_click_settings = () => {
    DBeacon.control_row.classList[DBeacon.settings_open ? 'remove' : 'add']('open');
    DBeacon.control_row.classList[DBeacon.settings_open ? 'remove' : 'add']('closed');
};
DBeacon.on_load_style = () => DBeacon.map.on('click', (e) => DBeacon.on_click_map(e));
DBeacon.on_click_map = (ev) => {
    if (DBeacon.inspector_visible) {
        DBeacon.clear_inspector();
    }
    let features = DBeacon.map.queryRenderedFeatures(ev.point);
    if (!features.length)
        return;
    ev.preventDefault();
    try {
        let coords = features[0].geometry['coordinates'];
        DBeacon.locator_marker = new mapboxgl.Marker({ element: DBeacon.icons.locator });
        DBeacon.locator_marker.setLngLat(coords).setPitchAlignment('map').addTo(DBeacon.map);
        DBeacon.map.flyTo({ animate: true, center: coords });
        DBeacon.render_feature(features[0]);
    }
    catch (e) { }
};
window.onload = DBeacon.init;
//# sourceMappingURL=dbeacon.js.map