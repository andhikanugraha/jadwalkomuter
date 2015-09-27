var $ = require('jquery');
var storage = require('./storage');

function rebuildStationLinks(stations) {
  var list = $('#station-list');
  var prevHTML = list.html();
  var tpl = (s) => `<li class="list-group-item"><a href="${s.path}/">${s.name}</a></li>`;
  var newHTML = stations.map(tpl).join('');
  if (prevHTML !== newHTML) {
    $('#station-list').html(newHTML);
  }
}
$(function() {
  var filteredStations = data;
  function processQuery(query) {
    if (query.length === 0) {
      filteredStations = data;
    }
    else {
      var pattern = new RegExp(`.*${query}.*`, 'i');
      filteredStations = data.filter(s => (pattern.exec(s.name) || pattern.exec(s.path) || pattern.exec(s.key)));
    }
    console.log(filteredStations);
    rebuildStationLinks(filteredStations);
  }
  $('#station-search').keydown(function(e) {
    if (e.keyCode === 13) { // enter
      e.preventDefault();
      location.href = filteredStations[0].path + '/';
    }
  });
  $('#station-search').on('keyup change', function(e) {
    processQuery(this.value);
  });
  // $(window).load(function() {
    processQuery($('#station-search').val())
  // });
});