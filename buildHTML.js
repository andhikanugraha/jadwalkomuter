'use strict';

let fs = require('fs-promise');
let handlebars = require('handlebars');
let lodash = require('lodash');
let stationIndex = {};
let stations = [];

// TODO load from dist instead of src
function buildStationTimetables() {
  stationIndex = require('./dist/index.json');
  let stationKeys = Object.keys(stationIndex);
  Object.keys(stationIndex).forEach(key => {
    let station = stationIndex[key];
    station.key = key;
    stations.push(station);
  });

  return buildIndexHTML(stations).then(() => Promise.all(stations.map(station => buildStationHTML(station))));
}

function buildIndexHTML(stations) {
  let source = fs.readFileSync('src/views/index.hbs');
  let template = handlebars.compile(source.toString());

  var htmlString = template({stations, json: JSON.stringify(stations)});
  var outputPath = `dist/index.html`;
  return fs.writeFile(outputPath, htmlString)
    // .then(() => fs.writeFile(outputPathShort, htmlString))
    .then(() => console.log(`Written file ${outputPath}`));
}

function buildStationHTML(station) {
  return fs.readFile(`dist/${station.path}/index.json`).then(jsonString => {
    let stationData = JSON.parse(jsonString);
    let locals = {
      stationKey: station.key,
      stationName: station.name,
      destinations: stationData.destinations.map(dest => {
        return {
          key: dest,
          name: stationIndex[dest].name
        }
      }),
      departures: stationData.departures.map(dep => {
        return {
          timeString: dep[0],
          destination: stationIndex[dep[1]].name,
          destinationKey: stationIndex[dep[1]].key
        }
      })
    };

    let source = fs.readFileSync('src/views/station.hbs');
    let template = handlebars.compile(source.toString());

    var htmlString = template(locals);
    var outputPath = `dist/${station.path}/index.html`;
    var outputPathShort = `dist/${station.key.toLowerCase()}/index.html`;
    return fs.writeFile(outputPath, htmlString)
      // .then(() => fs.writeFile(outputPathShort, htmlString))
      .then(() => console.log(`Written file ${outputPath}`));
  });
}

module.exports = buildStationTimetables;