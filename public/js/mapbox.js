mapboxgl.accessToken =
    'pk.eyJ1Ijoic2RiOTkiLCJhIjoiY2p0eDVpNm13MDRzeDQzcG5vaXVqMnU1bSJ9.PUYfMiyYeiyO9L_7JXcD9g';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: campground.coordinates,
    zoom: 3
});
// create a HTML element for our location
var el = document.createElement('div');
el.className = 'marker';

// make a marker for our location
new mapboxgl.Marker(el)
    .setLngLat(campground.coordinates)
    .setPopup(new mapboxgl.Popup({
            offset: 25
        }) // add popups
        .setHTML('<h3>' + campground.title + '</h3><p>' + campground.location + '</p>')
    )
    .addTo(map);