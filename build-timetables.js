'use strict';

let cheerio = require('cheerio');
let request = require('request-promise');

const BASE_URL = 'http://www.krl.co.id/infonew/rute_jadwal.php';

let symbolMap = new Map(); // map for symbols, for efficiency
let stationByShortNames = new Map();
let stationTimetables = new Map(); // key: Symbol.for(long station name), value: Map of Departures(key: timeString)
let trainTimetables = new Map(); // key: Symbol.for(trainId), value: Map of Departures(key: timeString)

let numRecordsRegex = /Terdapat ([0-9]+) data/;

class Departure {
  constructor(timeString, stationName, trainId) {
    this.timeString = timeString;
    this.stationSymbol = Symbol.for(stationName);
    this.trainSymbol = Symbol.for(trainId);
  }

  addToIndex() {
    stationTimetables.get(this.stationSymbol).set(this.timeString, this);
    trainTimetables.get(this.trainSymbol).set(this.timeString, this);
  }
}

function stationUrl(shortName, page) { // page starts from 1
  let start = (page - 1) * 10;
  return `${BASE_URL}?stasiun_singgah=${shortName}&start=${start}`;
}

// load schedules
function loadStationNames() {
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
        symbolMap.set(stationSymbol, fullName);
        stationTimetables.set(stationSymbol, new Map());
      }
    });

    trainOptionElements.each(function() {
      let el = $(this);
      let trainId = el.attr('value');
      let trainSymbol = Symbol.for(trainId);
      if (trainId !== '') {
        symbolMap.set(trainSymbol, trainId);
        trainTimetables.set(trainSymbol, new Map());
      }
    });

    return stationByShortNames;
  });
}

function loadStation(shortName, page) {
  request(stationUrl(shortName)).then(body => {

    var stationPromise = processPage(body);

    if (page === undefined) {
      let numRecords = numRecordsRegex.exec(body)[1];
      let numPages = Math.ceil(numRecords / 10);

      if (numPages > 1) {
        for (let i = 2; i <= numPages; ++i) {
          stationPromise = stationPromise.then(() => loadStation(shortName, i));
        }
      }
    }

    return stationPromise.then(() => {
      console.log(`Completed station ${shortName}`);
    });
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
    var depObj = new Departure(timeString, stationName, trainId);
    depObj.addToIndex();
  });

  return Promise.resolve(true);
}

loadStationNames().then(stationByShortNames => {
  let stationPromises = [];
  stationByShortNames.forEach((fullName, shortName) => {
    stationPromises.push(loadStation(shortName));
  });
});