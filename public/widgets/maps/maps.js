export const mapsWidget = {
  init() {
    this.el = document.getElementById('maps-widget');
    if (!this.el) return;
    this.render();
    setTimeout(() => this.initMap(), 200);
  },
  render() {
    this.el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;min-height:20px;">' +
      '<span style="font-size:1.4rem;font-weight:600;color:#fff;opacity:0.85;">с. Щасливе — м. Лівобережна</span>' +
      '<span style="font-size:1.2rem;opacity:0.5;" id="map-eta">Час: -- хв</span></div>' +
      '<div style="flex:1;min-height:0;border-radius:6px;overflow:hidden;">' +
      '<div id="miniMap" style="width:100%;height:100%;"></div></div>';
  },
  initMap() {
    var el = document.getElementById('miniMap');
    if (!el || el.offsetHeight === 0) return;
    if (typeof L === 'undefined') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => this.buildMap();
      document.head.appendChild(script);
    } else { this.buildMap(); }
  },
  buildMap() {
    var el = document.getElementById('miniMap');
    if (!el || el.offsetHeight === 0) return;
    var map = L.map(el, {zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false}).setView([50.42, 30.70], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(map);
    var startLat=50.3752, startLng=30.7989, endLat=50.4517, endLng=30.5981;
    var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + startLng+','+startLat+';'+endLng+','+endLat + '?overview=full&geometries=geojson';
    fetch(osrmUrl).then(function(r){return r.json()}).then(function(data){
      if (data.code!=='Ok') return;
      var coords=data.routes[0].geometry.coordinates;
      var latLngs=coords.map(function(c){return[c[1],c[0]]});
      L.polyline(latLngs,{color:'#00a3ff',weight:4,opacity:0.85}).addTo(map);
      L.circleMarker([startLat,startLng],{radius:4,color:'#3ddc84'}).addTo(map);
      L.circleMarker([endLat,endLng],{radius:4,color:'#ff9500'}).addTo(map);
      map.fitBounds(L.latLngBounds(latLngs),{padding:[15,15]});
      var durMin=Math.round(data.routes[0].duration/60);
      var eta=document.getElementById('map-eta');
      if(eta) eta.textContent='Час: '+durMin+' хв';
    }).catch(function(){});
  }
};
