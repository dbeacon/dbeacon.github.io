/// <reference path="../node_modules/@types/bingmaps/index.d.ts" />
// import * as mapboxgl from '../node_modules/mapbox-gl/dist/mapbox-gl.js';
/// <reference path="../node_modules/@types/mapbox-gl/index.d.ts" />
class DBeacon {
    static init() {
        window['dbeacon'] = DBeacon;
        DBeacon.init_worker();
        DBeacon.button = document.querySelector('button');
        DBeacon.button.onclick = function () {
            DBeacon.locate();
        };
        window.ondeviceorientation = DBeacon.on_device_orientation;
        DBeacon.compass_container = document.querySelector('#compass-container');
        DBeacon.compass = document.querySelector('#compass');
        DBeacon.compass.onclick = DBeacon.on_click_compass;
        DBeacon.compass.ondblclick = DBeacon.on_dblclick_compass;
        DBeacon.compass.ondragstart = DBeacon.on_dragstart_compass;
        DBeacon.init_map();
        window.ontouchstart = () => { DBeacon.ready = false; };
        window.ontouchend = () => { window.setTimeout(() => { DBeacon.ready = true; }, 200); };
    }
    static init_worker() {
        if (!navigator.serviceWorker)
            return;
        try {
            navigator.serviceWorker.register('build/worker.js', { scope: '/build/' });
        }
        catch (e) { }
    }
    static init_map() {
        DBeacon.map_element = document.querySelector('#map');
        DBeacon.map = new mapboxgl.Map({
            accessToken: 'pk.eyJ1Ijoia2VucmVpbGx5IiwiYSI6ImNrbGR5c3o4cDA4bTAyd3FsY3pwanQ1YWkifQ.MoUKfLotk49_Z2QgtR0v6A',
            style: 'mapbox://styles/kenreilly/ckle0a9ay0oso18o1zqidsr39',
            container: 'map'
        });
        DBeacon.map.on('rotate', DBeacon.on_rotate);
        DBeacon.map.on('pitch', DBeacon.on_pitch);
    }
    static on_position(position) {
        if (DBeacon.map) {
            DBeacon.map.setCenter({ lat: position.coords.latitude, lon: position.coords.longitude });
            DBeacon.map.rotateTo(0);
        }
    }
    static on_error() {
    }
    static on_rotate(event) {
        var bearing = 360 - event.target.getBearing();
        DBeacon.compass.style.setProperty('--angle', bearing.toFixed(1).toString() + 'deg');
    }
    static on_pitch(event) {
        var pitch = (event.target.getPitch() * .7);
        DBeacon.compass_container.style.setProperty('--pitch', pitch.toFixed(1).toString() + 'deg');
    }
    static on_click_compass() {
        // DBeacon.map.rotateTo(0)
        DBeacon.heading_lock = !DBeacon.heading_lock;
    }
    static on_dblclick_compass() {
        DBeacon.locate();
    }
    static on_dragstart_compass(event) {
        debugger;
    }
    static on_device_orientation(event) {
        if (!DBeacon.ready)
            return;
        window.requestAnimationFrame(() => DBeacon.map.setBearing(360 - event.alpha));
    }
}
DBeacon.heading_lock = false;
DBeacon.ready = true;
DBeacon.locate = () => navigator.geolocation.getCurrentPosition(DBeacon.on_position, DBeacon.on_error);
window.onload = DBeacon.init;
