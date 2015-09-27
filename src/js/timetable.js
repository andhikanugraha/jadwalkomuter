var $ = require('jquery');
var storage = require('./storage');

function handleDelayWindow($) {
  function makeTimeString(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var str = '';

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
    var needle = '<tr .*data-time="' + timeString + '"';
    var pattern = new RegExp(needle);
    var theNeedle = html.match(pattern)[0];
    return html.replace(theNeedle, str + theNeedle);
  }

  // modify innerHTML of table for multiple tbodies
  var maybeDelayed = new Date();
  maybeDelayed.setTime(Date.now() - (30 * 60 * 1000));
  var maybeDelayedTimeString = makeTimeString(maybeDelayed);  
  console.log(maybeDelayedTimeString);

  var rightNow = new Date();
  var rightNowTimeString = makeTimeString(rightNow);
  console.log(rightNowTimeString);

  var table = $('#timetable');

  var html = table.html();
  var timeStrings = html.match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/g);
  console.log(timeStrings);

  html = html.replace('upcoming', 'past');

  var i = 0;
  while (timeStrings[i] < maybeDelayedTimeString) {
    ++i;
  }
  console.log(timeStrings[i]);

  var insertBeforeMaybeDelayed = '</tbody><tbody id="maybe-delayed">';
  html = insertBeforeTr(insertBeforeMaybeDelayed, timeStrings[i], html);

  while (timeStrings[i] < rightNowTimeString) {
    ++i;
  }

  console.log(timeStrings[i]);

  var insertBeforeNextOne = '</tbody><tbody id="upcoming">';
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
  var currentStationKey = $('body').attr('data-station-key');
  const STORAGE_PREFIX = `showdest:${currentStationKey}:`;

  var expandStorageKey = STORAGE_PREFIX + '_expand';
  var destinationSelector = $('#destination-selector');
  var toggleHeader = $('.card-header', destinationSelector);
  var destinationUl = $('ul', destinationSelector);

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

  var destinations = [];
  var toggles = $('#destination-toggles input[type=checkbox]');

  var styleElement = $('<style>');
  $('head').append(styleElement);
  function showHideDepartures() {
    var invisibleDestinations = [];
    destinations.forEach(dest => {
      if (storage.get(STORAGE_PREFIX + dest) === false) {
        invisibleDestinations.push(dest);
      }
    });

    console.log(invisibleDestinations);

    if (invisibleDestinations.length > 0) {
      var selector = invisibleDestinations.map(dest => `tr[data-destination=${dest}]`).join(', ');
      styleElement.text(`${selector} { display: none }`);
    }
    else {
      styleElement.text('');
    }
  }

  toggles.each(function() {
    var toggle = $(this);
    var dest = this.getAttribute('data-destination');

    destinations.push(dest);

    var storageKey = STORAGE_PREFIX + dest;

    toggle.prop('checked', storage.get(storageKey));

    storage.bind(storageKey, value => {
      toggle.prop('checked', value);
      showHideDepartures();
    });
    toggle.change(function() {
      var isChecked = $(this).prop('checked');
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