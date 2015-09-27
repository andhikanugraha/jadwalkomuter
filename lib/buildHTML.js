'use strict';

let fs = require('fs-promise');
let gutil = require('gulp-util');
let handlebars = require('handlebars');
let lodash = require('lodash');
let stationIndex = {};
let stations = [];

// TODO load from dist instead of src
function buildStationTimetables() {
  stationIndex = require('../dist/index.json');
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

  let htmlString = template({ stations });
  let outputPath = `dist/index.html`;
  return fs.writeFile(outputPath, htmlString)
    // .then(() => fs.writeFile(outputPathShort, htmlString))
    .then(() => gutil.log('Written', gutil.colors.cyan(outputPath)));
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
          timeString: dep[0].substring(0,5),
          destination: stationIndex[dep[1]].name,
          destinationKey: stationIndex[dep[1]].key
        }
      })
    };

    let source = fs.readFileSync('src/views/station.hbs');
    let template = handlebars.compile(source.toString());

    let htmlString = template(locals);
    let outputDir = `dist/${station.path}`;
    let outputDirShort = `dist/${station.key.toLowerCase()}`;
    let outputPath = `${outputDir}/index.html`;
    let outputPathShort = `${outputDirShort}/index.html`;
    return fs.exists(outputDir)
      .then((exists) => exists ? true : fs.mkdir(outputDir))
      .then(() => fs.writeFile(outputPath, htmlString))
      .then(() => gutil.log('Written', gutil.colors.cyan(outputPath)))
      .then(() => fs.exists(outputDirShort))
      .then((exists) => exists ? true : fs.mkdir(outputDirShort))
      .then(() => fs.writeFile(outputPathShort, htmlString))
      .then(() => gutil.log('Written', gutil.colors.cyan(outputPathShort)));
  });
}

module.exports = buildStationTimetables;