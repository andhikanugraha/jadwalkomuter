'use strict';

let fs = require('fs-promise');
let handlebars = require('handlebars');
let lodash = require('lodash');
let stationIndex = require('./dist/index.json');
let stations = [];

// TODO load from dist instead of src
function buildStationTimetables() {
  let stationKeys = Object.keys(stationIndex);
  Object.keys(stationIndex).forEach(key => {
    let station = stationIndex[key];
    station.key = key;
    stations.push(station);
  });

  return Promise.all(stations.map(station => buildStationHTML(station)));
}

function buildStationHTML(station) {
  return fs.readFile(`dist/${station.path}/index.json`).then(jsonString => {
    let stationData = JSON.parse(jsonString);
    let locals = {
      stationName: station.name,
      destinations: {},
      departures: stationData.departures.map(dep => {
        return {
          timeString: dep[0],
          destination: stationIndex[dep[1]].name
        }
      })
    };

    let source = fs.readFileSync('src/views/station.hbs');
    let template = handlebars.compile(source.toString());

    var htmlString = template(locals);
    var outputPath = `dist/${station.path}/index.html`;
    var outputPathShort = `dist/${station.key.toLowerCase()}/index.html`;
    return fs.writeFile(outputPath, htmlString)
      .then(() => fs.writeFile(outputPathShort, htmlString))
      .then(() => console.log(`Written file ${outputPath}`));
  });
}

module.exports = buildStationTimetables;