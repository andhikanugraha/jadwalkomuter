'use strict';

let cheerio = require('cheerio');
let handlebars = require('handlebars');
let lodash = require('lodash');
let request = require('request-promise');
let fs = require('fs-promise');
let yaml = require('js-yaml');

const BASE_URL = 'http://www.krl.co.id/infonew/rute_jadwal.php';

let symbolMap = new Map(); // map for symbols, for efficiency
let stationNames = new Map();
let shortStationNames = new Map();
let stationByShortNames = new Map();
let stationTimetables = new Map(); // key: Symbol.for(long station name), value: Set of Departures
let trainTimetables = new Map(); // key: Symbol.for(trainId), value: Set of Departures
let destinationMap = new Map(); // key: Symbol.for(long station name), value: Set of Symbol.for(long destination name)

let numRecordsRegex = /Terdapat ([0-9]+) data/;

class Departure {
  constructor(timeString, stationName, destinationName, trainId) {
    this.timeString = timeString;
    this.stationSymbol = Symbol.for(stationName);
    this.destinationSymbol = Symbol.for(destinationName);
    this.trainSymbol = Symbol.for(trainId);
  }

  addToIndex() {
    stationTimetables.get(this.stationSymbol).add(this);
    trainTimetables.get(this.trainSymbol).add(this);
    let destinationSet = destinationMap.get(this.stationSymbol);
    if (!destinationSet.has(this.destinationSymbol)) {
      destinationSet.add(this.destinationSymbol);
    }
  }
}

function stationUrl(shortName, page) { // page starts from 1
  let start = (page - 1) * 10;
  return `${BASE_URL}?stasiun_singgah=${shortName}&start=${start}`;
}

// load schedules
function loadStationNames() {
  let yamlString = fs.readFileSync('src/stationNames.yml');
  let yamlObj = yaml.safeLoad(yamlString);

  Object.keys(yamlObj).forEach(key => {
    stationNames.set(Symbol.for(key), yamlObj[key]);
  });

  return Promise.resolve(stationNames);
}

function loadInitialData() {
  return request(BASE_URL).then(body => {
    let $ = cheerio.load(body);
    let stationOptionElements = $('select[name=stasiun_singgah] > option');
    let trainOptionElements = $('select[name=ska_id] > option');
    stationOptionElements.each(function() {
      let el = $(this);
      let shortName = el.attr('value');
      let fullName = el.text();
      let stationSymbol = Symbol.for(fullName);

      if (shortName !== '') {
        stationByShortNames.set(shortName, fullName);
        shortStationNames.set(stationSymbol, shortName);
        symbolMap.set(stationSymbol, fullName);
        stationTimetables.set(stationSymbol, new Set());
        destinationMap.set(stationSymbol, new Set());
      }
    });

    trainOptionElements.each(function() {
      let el = $(this);
      let trainId = el.attr('value');
      let trainSymbol = Symbol.for(trainId);
      if (trainId !== '') {
        symbolMap.set(trainSymbol, trainId);
        trainTimetables.set(trainSymbol, new Set());
      }
    });

    return buildIndexJSON();
  });
}

function loadStation(shortName, page) {
  return request(stationUrl(shortName, page)).then(body => {

    let stationPromise = processPage(body);

    if (page === undefined) {
      console.log('Loading station:', shortName);
      let numRecords = numRecordsRegex.exec(body)[1];
      let numPages = Math.ceil(numRecords / 10);

      if (numPages > 1) {
        for (let i = 2; i <= numPages; ++i) {
          stationPromise = stationPromise.then(() => loadStation(shortName, i));
        }
      }

      stationPromise = stationPromise.then(() => {
        buildStationJSON(shortName);
      });
    }

    return stationPromise;
  });
}

function processPage(body) {
  let $ = cheerio.load(body);
  let rows = $('tr[onmouseover]');
  rows.each(function() {
    let td = $('td', this);
    let trainId = $(td[1]).text().trim();
    let stationName = $(td[6]).text().trim();
    let timeString = $(td[8]).text().trim();

    let routeName = $(td[4]).text().trim();
    let destinationName = routeName.match(/[A-Z]+-([A-Z]+)/)[1];

    if (destinationName !== stationName) {
      let depObj = new Departure(timeString, stationName, destinationName, trainId);
      depObj.addToIndex();
    }
  });

  return Promise.resolve(true);
}

function buildIndexJSON() {
  let indexObj = {};
  stationByShortNames.forEach((fullName, shortName) => {
    indexObj[shortName] = {
      path: fullName.toLowerCase(),
      name: stationNames.get(Symbol.for(fullName))
    }
  });

  let jsonString = JSON.stringify(indexObj);
  return fs.writeFile('dist/index.json', jsonString)
    .then(() => console.log(`Written file dist/index.json`));
  return Promise.resolve(true);
}

function buildStationJSON(shortName) {
  let fullName = stationByShortNames.get(shortName);
  let stationSymbol = Symbol.for(fullName);

  let locals = {
    // stationName: stationNames.get(Symbol.for(fullName)),
    destinations: [],
    departures: []
  };

  let destinations = destinationMap.get(stationSymbol);
  destinations.forEach(destinationSymbol => {
    let destinationShortName = shortStationNames.get(destinationSymbol);
    let newIndex = lodash.sortedIndex(locals.destinations, destinationShortName);
    locals.destinations.splice(newIndex, 0, destinationShortName);
  });

  let departures = stationTimetables.get(stationSymbol);
  departures.forEach(departure => {
    let departureObj = [
      departure.timeString,
      shortStationNames.get(departure.destinationSymbol)
    ];
    let newIndex = lodash.sortedIndex(locals.departures, departureObj, 0);
    locals.departures.splice(newIndex, 0, departureObj);
  });

  locals.departures = lodash.sortBy(locals.departures, 'timeString');

  let jsonString = JSON.stringify(locals);
  let outputPath = `dist/${fullName.toLowerCase()}`;

  return fs.exists(outputPath)
    .then((exists) => exists ? true : fs.mkdir(outputPath))
    .then(() => fs.writeFile(outputPath + '/index.json', jsonString))
    .then(() => console.log(`Written file ${outputPath}/index.json`));
}

module.exports = function() {
  return loadStationNames()
    .then(() => loadInitialData())
    .then(() => {
      let stationPromises = [];
      stationByShortNames.forEach((fullName, shortName) => {
        console.log(fullName);
      });
      stationByShortNames.forEach((fullName, shortName) => {
        stationPromises.push(loadStation(shortName));
      });
      return Promise.all(stationPromises);
    });
}