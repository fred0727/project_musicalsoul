setTimeout(() => {
  if (window.location.hash) {
    const offset = window.innerWidth < 1024 ? 90 : 120
    window.scrollTo(0, (window.pageYOffset || window.scrollY) - offset)
  }
}, 100)

let marker = null
const MADRID_COORDS = {
  lat: 40.416775,
  lng: -3.70379,
};

function initMap() {
  console.log('initmap')
  const map = new google.maps.Map(document.getElementById("map"), {
    center:MADRID_COORDS,
    zoom: 15,
  });


  const locationInput = document.querySelector('input[name="location"]')

  if (!marker) {
    marker = new google.maps.Marker({
      position: MADRID_COORDS
      // title: "Location Place or Anything that you want to tooltip while hovering"
    });
    
  }

  document.querySelector('#locationButton').addEventListener('click', (e) => {
    e.target.innerHTML = 'Cargando...'
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locationInput.value = `${coords.lat}|${coords.lng}`
      marker.setPosition(coords)
      map.setCenter(coords)
      e.target.innerHTML = 'Usar mi ubicación actual'
    });
    marker.setMap(map)
  })

  map.addListener('click', (event) => {
    const mouseCoords = event.latLng
    locationInput.value = `${mouseCoords.lat()}|${mouseCoords.lng()}`
    marker.setMap(map)
    marker.setPosition(mouseCoords)
  })
}

function createMarker() {

}

