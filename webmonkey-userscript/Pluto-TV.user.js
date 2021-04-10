// ==UserScript==
// @name         Pluto TV
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://pluto.tv/*
// @match        *://*.pluto.tv/*
// @icon         https://pluto.tv/assets/images/favicons/favicon.png
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-Pluto-TV/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-Pluto-TV/issues
// @downloadURL  https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @updateURL    https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var constants = {
  "debug":              false,
  "title":              "Pluto TV: Program Guide",
  "target_pathname":    "/careers",
  "dom_ids": {
    "div_controls":     "EPG_controls",
    "div_data":         "EPG_data",
    "from_date_select": "from_date",
    "to_date_select":   "to_date",
    "button_refresh":   "load_data"
  },
  "dom_classes": {
    "collapsible":      "collapsible"
  },
  "epg_url_qs": {
    "appVersion":       "5.16.0-d477896b413cece569cca008ddae951d02cadc9e",
    "deviceLat":        "38.8979",
    "deviceLon":        "-77.0365",
    "deviceMake":       "Chrome",
    "deviceVersion":    "90.0.4710.39"
  }
}

// ----------------------------------------------------------------------------- DOM: static skeleton

var reinitialize_dom = function() {
  var head = unsafeWindow.document.getElementsByTagName('head')[0]
  var body = unsafeWindow.document.body

  var html = {
    "head": [
      '<style>',

      'body {',
      '  text-align: center;',
      '}',

      '#EPG_controls {',
      '  display: inline-block;',
      '}',

      '#EPG_controls > div {',
      '  margin: 1.25em 0;',
      '  text-align: right;',
      '}',

      '#EPG_controls > div:last-child {',
      '  text-align: center;',
      '}',

      '#EPG_controls > div > select,',
      '#EPG_controls > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',

      '#EPG_controls > div > select {',
      '  margin-left: 2em;',
      '}',

      '#EPG_controls > div > select > option {',
      '  font-family: monospace;',
      '  text-align: right;',
      '}',

      '#EPG_data {',
      '  margin-top: 0.5em;',
      '  background-color: #999;',
      '  text-align: left;',
      '}',

      '#EPG_data > div {',
      '  border: 1px solid #333;',
      '}',

      '#EPG_data > div > h2 {',
      '  display: block;',
      '  width: 75%;',
      '  background-color: #ccc;',
      '  padding: 0.25em;',
      '  margin: 0;',
      '  color: blue;',
      '  cursor: pointer;',
      '}',

      '#EPG_data > div > div.collapsible {',
      '  background-color: #fff;',
      '  padding: 0.5em;',
      '}',

      '#EPG_data > div > div.collapsible ul > li > blockquote {',
      '  background-color: #eee;',
      '  padding: 0.5em 1em;',
      '  margin: 0;',
      '}',

      '</style>'
    ],
    "body": [
      '<div id="PlutoTV_EPG">',
      '  <div id="EPG_controls"></div>',
      '  <div id="EPG_data"></div>',
      '</div>'
    ]
  }

  head.innerHTML = '' + html.head.join("\n")
  body.innerHTML = '' + html.body.join("\n")

  unsafeWindow.document.title = constants.title
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - controls

var convert_mins_to_ms = function(X) {
  // (1000 ms/sec)(60 sec/min)(X min)
  return 1000 * 60 * X
}

// https://stackoverflow.com/a/10789415
var get_previous_30_min_date = function(date, offset_mins) {
  if (!(date instanceof Date)) date = new Date()
  var offset_ms = (typeof offset_mins === 'number') ? convert_mins_to_ms(offset_mins) : 0
  var coeff = convert_mins_to_ms(30)
  return new Date(Math.round((date.getTime() + offset_ms) / coeff) * coeff)
}

// https://stackoverflow.com/a/17415677
var get_date_iso_string = function(date) {
  if (!(date instanceof Date)) date = new Date()
  var tzo = -date.getTimezoneOffset()
  var dif = tzo >= 0 ? '+' : '-'
  var pad = function(num) {
      var norm = Math.floor(Math.abs(num))
      return (norm < 10 ? '0' : '') + norm
  }
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60)
}

if (constants.debug) {
  console.log(get_date_iso_string(get_previous_30_min_date(null, -60)))
  console.log(get_date_iso_string(get_previous_30_min_date(null, -30)))
  console.log(get_date_iso_string(get_previous_30_min_date()))
  console.log(get_date_iso_string(get_previous_30_min_date(null, +30)))
  console.log(get_date_iso_string(get_previous_30_min_date(null, +60)))
}

// https://stackoverflow.com/a/8888498
var get_12_hour_time_string = function(date, hour_padding) {
  if (!(date instanceof Date)) date = new Date()
  var hours = date.getHours()
  var minutes = date.getMinutes()
  var ampm = (hours >= 12) ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  hours = (hour_padding && (hours < 10)) ? (hour_padding + hours) : hours
  minutes = (minutes < 10) ? ('0' + minutes) : minutes
  return hours + ':' + minutes + ' ' + ampm
}

var make_date_select_element = function(count_30_min_blocks, direction) {
  if (!direction || (typeof direction !== 'number'))
    direction = 1
  else if (direction > 0)
    direction = 1
  else
    direction = -1

  if (!count_30_min_blocks || (typeof count_30_min_blocks !== 'number'))
    count_30_min_blocks = 6 // 3 hours

  var select = unsafeWindow.document.createElement('select')

  select.setAttribute('id', (direction === -1) ? constants.dom_ids.from_date_select : constants.dom_ids.to_date_select)

  var date = new Date()
  var option, date_iso_string, date_obj, time_string
  var i = (direction === -1) ? 0 : 1
  var is_first_option = true

  for (; i <= count_30_min_blocks; i++) {
    option          = unsafeWindow.document.createElement('option')
    date_iso_string = get_date_iso_string(get_previous_30_min_date(date, (i * 30 * direction)))
    date_obj        = new Date(date_iso_string)
    time_string     = date_obj.toLocaleDateString() + ' ' + get_12_hour_time_string(date_obj, '&nbsp;')

    option.setAttribute('value', date_iso_string)
    option.innerHTML = time_string

    if (is_first_option) {
      option.setAttribute('selected', 'selected')
      is_first_option = false
    }

    select.appendChild(option)
  }

  return select
}

var onclick_refresh_button = function() {
  var from_date_iso_string = unsafeWindow.document.getElementById(constants.dom_ids.from_date_select).value
  var to_date_iso_string   = unsafeWindow.document.getElementById(constants.dom_ids.to_date_select).value

  if (from_date_iso_string && to_date_iso_string) {
    fetch_epg_url(from_date_iso_string, to_date_iso_string)
  }
}

var make_refresh_button = function() {
  var button = unsafeWindow.document.createElement('button')

  button.setAttribute('id', constants.dom_ids.button_refresh)
  button.innerHTML = 'Load/Refresh EPG Data'
  button.addEventListener("click", onclick_refresh_button)

  return button
}

var make_span = function(text) {
  var span = unsafeWindow.document.createElement('span')

  span.innerHTML = text

  return span
}

var populate_dom_controls = function() {
  var count_30_min_blocks = 48 // 1 day
  var select_from         = make_date_select_element(count_30_min_blocks, -1)
  var select_to           = make_date_select_element(count_30_min_blocks,  1)
  var refresh_button      = make_refresh_button()
  var EPG_controls        = unsafeWindow.document.getElementById(constants.dom_ids.div_controls)
  var div

  EPG_controls.innerHTML  = ''

  div = unsafeWindow.document.createElement('div')
  div.appendChild(make_span('From: '))
  div.appendChild(select_from)
  EPG_controls.appendChild(div)

  div = unsafeWindow.document.createElement('div')
  div.appendChild(make_span('To: '))
  div.appendChild(select_to)
  EPG_controls.appendChild(div)

  div = unsafeWindow.document.createElement('div')
  div.appendChild(refresh_button)
  EPG_controls.appendChild(div)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - EPG data

var onclick_channel_div = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var div = event.target
  if (!div || !(div instanceof HTMLElement)) return

  var collapsible_div = div.querySelector(':scope > .' + constants.dom_classes.collapsible)
  if (!collapsible_div || !(collapsible_div instanceof HTMLElement)) return

  var display = collapsible_div.style.display
  collapsible_div.style.display = (display === 'none') ? 'block' : 'none'
}

var process_hls_url = function(hls_url, referer_url) {
  GM_startIntent(/* action= */ 'android.intent.action.VIEW', /* data= */ hls_url, /* type= */ 'application/x-mpegurl', /* extras: */ 'referUrl', referer_url)
}

var onclick_channel_title = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var h2          = event.target
  var hls_url     = h2.getAttribute('x-hls-url')
  var referer_url = h2.getAttribute('x-referer-url')

  if (hls_url && referer_url) {
    process_hls_url(hls_url, referer_url)
  }
}

var make_episode_listitem_html = function(data) {
  var dates = {
    obj: {},
    str: {}
  }

  var temp

  if (data.start) {
    temp            = new Date(data.start)
    dates.obj.start = temp
    dates.str.start = temp.toLocaleDateString() + ' ' + get_12_hour_time_string(temp)
  }

  if (data.stop) {
    temp           = new Date(data.stop)
    dates.obj.stop = temp
    dates.str.stop = temp.toLocaleDateString() + ' ' + get_12_hour_time_string(temp)
  }

  if (data.duration) {
    // (X ms)(1 sec / 1000 ms)(1 min / 60 sec)
    dates.str.duration = Math.ceil(data.duration / 60000) + ' minutes'
  }

  var html = []

  if (data.title)
    html.push('title: '     + data.title)
  if (dates.str.start)
    html.push('starts at: ' + dates.str.start)
  if (dates.str.stop)
    html.push('ends at: '   + dates.str.stop)
  if (dates.str.duration)
    html.push('duration: '  + dates.str.duration)
  if (data.description)
    html.push('summary: '   + '<blockquote>' + data.description + '</blockquote>')

  return '<li>' + html.join('<br>') + '</li>'
}

var make_channel_div = function(data) {
  var slug, name, summary, hls_url, episodes, div, html
  var temp, temp2

  slug = data.slug
  if (!slug) slug = ''

  name = data.name
  if (!name) return null

  summary = data.summary

  if (data.isStitched) {
    if (data.stitched && Array.isArray(data.stitched.urls) && data.stitched.urls.length) {
      for (var i=0; !hls_url && (i < data.stitched.urls.length); i++) {
        temp = data.stitched.urls[i]

        if (temp && (typeof temp === 'object') && (temp.type === 'hls') && temp.url) {
          hls_url = temp.url
          break
        }
      }
    }
  }
  else {
    if (data.timelines && Array.isArray(data.timelines) && data.timelines.length) {
      for (var i=0; !hls_url && (i < data.timelines.length); i++) {
        temp = data.timelines[i]

        if (temp && (typeof temp === 'object') && temp.episode && (typeof temp.episode === 'object') && Array.isArray(temp.episode.sourcesWithClipDetails) && temp.episode.sourcesWithClipDetails.length) {
          for (var i2=0; !hls_url && (i2 < temp.episode.sourcesWithClipDetails.length); i2++) {
            temp2 = temp.episode.sourcesWithClipDetails[i2]

            if (temp2 && (typeof temp2 === 'object') && temp2.url) {
              hls_url = temp2.url
              break
            }
          }
        }
      }
    }
  }
  if (!hls_url) return null

  episodes = []
  if (data.timelines && Array.isArray(data.timelines) && data.timelines.length) {
    for (var i=0; i < data.timelines.length; i++) {
      temp  = data.timelines[i]
      temp2 = {}

      if (temp && (typeof temp === 'object')) {
        temp2.start = temp.start
        temp2.stop  = temp.stop
        temp2.title = temp.title

        if (temp.episode && (typeof temp.episode === 'object')) {
          temp2.duration    = temp.episode.duration
          temp2.description = temp.episode.description
        }
      }

      if (temp2.start && temp2.stop && temp2.title) {
        episodes.push(temp2)
      }
    }
  }

  div = unsafeWindow.document.createElement('div')

  html = [
    '<h2 x-hls-url="' + hls_url + '" x-referer-url="https://pluto.tv/live-tv/' + slug + '">' + name + '</h2>',
    '<div class="' + constants.dom_classes.collapsible + '" style="display:none">',
    '  <div>' + summary + '</div>',
    '  <ul>' + episodes.map(make_episode_listitem_html).join("\n") + '</ul>',
    '</div>'
  ]

  div.innerHTML = html.join("\n")
  div.addEventListener("click", onclick_channel_div)
  div.querySelector(':scope > h2').addEventListener("click", onclick_channel_title)
  return div
}

var process_epg_data = function(data) {
  var EPG_data  = unsafeWindow.document.getElementById(constants.dom_ids.div_data)
  EPG_data.innerHTML = ''

  if (
       !data || (typeof data !== 'object')
    || !data.channels   || !Array.isArray(data.channels)   || !data.channels.length
//  || !data.categories || !Array.isArray(data.categories) || !data.categories.length
  ) return

  var channel_data, div

  for (var i=0; i < data.channels.length; i++) {
    channel_data = data.channels[i]

    div = make_channel_div(channel_data)
    if (div) {
      EPG_data.appendChild(div)
    }
  }
}

// ----------------------------------------------------------------------------- EPG: download data

// https://stackoverflow.com/a/2117523
var generate_uuidv4 = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0
    var v = (c == 'x') ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

var get_epg_url = function(from_date_iso_string, to_date_iso_string) {
  var uuids = {
    "device":  generate_uuidv4(),
    "session": generate_uuidv4()
  }

  var epg_url_qs = [
    'start='      + encodeURIComponent(from_date_iso_string),
    'stop='       + encodeURIComponent(to_date_iso_string),
    'appVersion=' + constants.epg_url_qs.appVersion,
    'advertisingId=',
    'appName=web',
    'app_name=web',
    'clientDeviceType=0',
    'clientModelNumber=na',
    'deviceDNT=false',
    'clientID='      + uuids.device,
    'deviceId='      + uuids.device,
    'deviceLat='     + constants.epg_url_qs.deviceLat,
    'deviceLon='     + constants.epg_url_qs.deviceLon,
    'deviceMake='    + constants.epg_url_qs.deviceMake,
    'deviceVersion=' + constants.epg_url_qs.deviceVersion,
    'deviceModel=web',
    'deviceType=web',
    'marketingRegion=US',
    'serverSideAds=false',
    'sessionID=' + uuids.session,
    'sid='       + uuids.session,
    'userId=',
    'attributeV4=foo'
  ]

  var epg_url = 'https://service-channels.clusters.pluto.tv/v1/guide?' + epg_url_qs.join('&')
  return epg_url
}

var fetch_epg_url = function(from_date_iso_string, to_date_iso_string) {
  var epg_url = get_epg_url(from_date_iso_string, to_date_iso_string)

  var xhr = new unsafeWindow.XMLHttpRequest()
  xhr.open("GET", epg_url, true, null, null)
  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          var epg_data = JSON.parse(xhr.responseText)
          process_epg_data(epg_data)
        }
        catch(error) {}
      }
    }
  }
  xhr.send()
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  var pathname = unsafeWindow.location.pathname

  if (pathname.indexOf(constants.target_pathname) === 0) {
    reinitialize_dom()
    populate_dom_controls()
  }
  else {
    unsafeWindow.location = constants.target_pathname
  }
}

init()

// -----------------------------------------------------------------------------
