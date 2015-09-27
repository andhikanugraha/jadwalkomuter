'use strict';

let $ = require('jquery');
let storage = require('./storage');

function handleDelayWindow($) {
  function makeTimeString(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let str = '';

    if (hours < 10) {
      str += '0';
    }
    str += hours;

    str += ':';

    if (minutes < 10) {
      str += '0';
    }
    str += minutes;

    str += ':';

    if (seconds < 10) {
      str += '0';
    }
    str += seconds;

    return str;
  }

  function insertBeforeTr(str, timeString, html) {
    let needle = '<tr .*data-time="' + timeString + '"';
    let pattern = new RegExp(needle);
    let theNeedle = html.match(pattern)[0];
    return html.replace(theNeedle, str + theNeedle);
  }

  // modify innerHTML of table for multiple tbodies
  let maybeDelayed = new Date();
  maybeDelayed.setTime(Date.now() - (30 * 60 * 1000));
  let maybeDelayedTimeString = makeTimeString(maybeDelayed);  
  console.log(maybeDelayedTimeString);

  let rightNow = new Date();
  let rightNowTimeString = makeTimeString(rightNow);
  console.log(rightNowTimeString);

  let table = $('#timetable');

  let html = table.html();
  let timeStrings = html.match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/g);
  console.log(timeStrings);

  html = html.replace('upcoming', 'past');

  let i = 0;
  while (timeStrings[i] < maybeDelayedTimeString) {
    ++i;
  }
  console.log(timeStrings[i]);

  let insertBeforeMaybeDelayed = '</tbody><tbody id="maybe-delayed">';
  html = insertBeforeTr(insertBeforeMaybeDelayed, timeStrings[i], html);

  while (timeStrings[i] < rightNowTimeString) {
    ++i;
  }

  console.log(timeStrings[i]);

  let insertBeforeNextOne = '</tbody><tbody id="upcoming">';
  html = insertBeforeTr(insertBeforeNextOne, timeStrings[i], html);

  table.html(html);

  $('#show-previous').click(function() {
    if (this.innerHTML === 'Tampilkan selengkapnya') {
      $('#past').show();
      this.innerHTML = 'Sembunyikan';
    }
    else {
      $('#past').fadeOut('fast');
      this.innerHTML = 'Tampilkan selengkapnya';
    }
  });
}

function handleDestinationToggles($) {
  let currentStationKey = $('body').attr('data-station-key');
  const STORAGE_PREFIX = `showdest:${currentStationKey}:`;

  let expandStorageKey = STORAGE_PREFIX + '_expand';
  let destinationSelector = $('#destination-selector');
  let toggleHeader = $('.card-header', destinationSelector);
  let destinationUl = $('ul', destinationSelector);

  storage.setDefault(expandStorageKey, true);
  storage.bind(expandStorageKey, value => {
    if (value) {
      destinationSelector.addClass('expanded');
      destinationUl.fadeIn('fast');
    }
    else {
      destinationSelector.removeClass('expanded');
      destinationUl.fadeOut('fast');
    }
  }, true);

  toggleHeader.click(function(e) {
    storage.toggle(expandStorageKey);
    e.preventDefault();
  });

  let destinations = [];
  let toggles = $('#destination-toggles input[type=checkbox]');

  let styleElement = $('<style>');
  $('head').append(styleElement);
  function showHideDepartures() {
    let invisibleDestinations = [];
    destinations.forEach(dest => {
      if (storage.get(STORAGE_PREFIX + dest) === false) {
        invisibleDestinations.push(dest);
      }
    });

    console.log(invisibleDestinations);

    if (invisibleDestinations.length > 0) {
      let selector = invisibleDestinations.map(dest => `tr[data-destination=${dest}]`).join(', ');
      styleElement.text(`${selector} { display: none }`);
    }
    else {
      styleElement.text('');
    }
  }

  toggles.each(function() {
    let toggle = $(this);
    let dest = this.getAttribute('data-destination');

    destinations.push(dest);

    let storageKey = STORAGE_PREFIX + dest;

    toggle.prop('checked', storage.get(storageKey));

    storage.bind(storageKey, value => {
      toggle.prop('checked', value);
      showHideDepartures();
    });
    toggle.change(function() {
      let isChecked = $(this).prop('checked');
      storage.set(storageKey, isChecked);
    });
    storage.setDefault(storageKey, true);
  });

  showHideDepartures();

  console.log(destinations);
}

$(function() {
  handleDelayWindow($);
  handleDestinationToggles($);
});