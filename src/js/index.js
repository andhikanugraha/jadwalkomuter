'use strict';

let $ = require('jquery');
let storage = require('./storage');

let allStationsRaw = require('../../dist/index.json');
let allStations = [];
Object.keys(allStationsRaw).forEach(key => {
  let station = allStationsRaw[key];
  station.key = key;
  allStations.push(station);
});

function rebuildStationLinks(stations) {
  let list = $('#station-list');
  let prevHTML = list.html();
  let tpl = (s) => `<li class="list-group-item"><a href="${s.path}/">${s.name}</a></li>`;
  let newHTML = stations.map(tpl).join('');
  if (prevHTML !== newHTML) {
    $('#station-list').html(newHTML);
  }
}
$(function() {
  let filteredStations = allStations;
  function processQuery(query) {
    if (query.length === 0) {
      filteredStations = allStations;
    }
    else {
      let pattern = new RegExp(`.*${query}.*`, 'i');
      filteredStations = allStations.filter(s => (pattern.exec(s.name) || pattern.exec(s.path) || pattern.exec(s.key)));
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