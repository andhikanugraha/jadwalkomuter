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

  return buildIndexHTML(stations)
    .then(() => buildCacheManifest())
    .then(() => Promise.all(stations.map(station => buildStationHTML(station))));
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

function buildCacheManifest() {
  let isoDate = (new Date()).toISOString();
  let lines = [];
  lines.push('CACHE MANIFEST');
  lines.push('');
  lines.push('# Allows the webapp to be loaded offline.');
  lines.push('# The following comment needs to be updated to update the cache.');
  lines.push('# Last updated: ' + isoDate);
  lines.push('');
  lines.push('CACHE:');
  lines.push('# Assets');
  lines.push('css/style.css');
  lines.push('js/timetable.js');
  lines.push('js/index.js');
  lines.push('fonts/fontawesome-webfont.eot');
  lines.push('fonts/fontawesome-webfont.svg');
  lines.push('fonts/fontawesome-webfont.ttf');
  lines.push('fonts/fontawesome-webfont.woff');
  lines.push('fonts/fontawesome-webfont.woff2');
  lines.push('fonts/FontAwesome.otf');
  lines.push('# Pages');
  lines.push('index.html');
  stations.forEach(station => {
    lines.push(station.path + '/');
    lines.push(station.path + '/index.html');
    lines.push(station.key.toLowerCase() + '/');
    lines.push(station.key.toLowerCase() + '/index.html');
  });
  lines.push('');
  lines.push('NETWORK:');
  lines.push('*');
  return fs.writeFile('dist/cache.appcache', lines.join('\n'));
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