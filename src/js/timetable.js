var $ = require('jquery');

$(function() {

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
    var needle = '<tr data-time="' + timeString + '"';
    return html.replace(needle, str + needle);
  }

  // modify innerHTML of table for multiple tbodies
  var oneHourAgo = new Date();
  oneHourAgo.setTime(Date.now() - (20 * 60 * 1000));
  var oneHourAgoTimeString = makeTimeString(oneHourAgo);	

  var rightNow = new Date();
  var rightNowTimeString = makeTimeString(rightNow);

  var table = $('#timetable');

  var html = table.html();
  var timeStrings = html.match(/[0-9]{2}:[0-9]{2}:[0-9]{2}/g);

  html = html.replace('upcoming', 'past');

  var i = 0;
  while (timeStrings[i] < oneHourAgoTimeString) {
    ++i;
  }

  var insertBeforeOneHourAgo = '</tbody><tbody id="maybe-delayed">';
  html = insertBeforeTr(insertBeforeOneHourAgo, timeStrings[i], html);

  while (timeStrings[i] < rightNowTimeString) {
    ++i;
  }

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
  })
});