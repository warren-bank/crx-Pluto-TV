// ==UserScript==
// @name         Pluto TV: live-tv
// @description  Watch videos in external player.
// @version      2.0.1
// @match        *://pluto.tv/*
// @match        *://*.pluto.tv/*
// @icon         https://pluto.tv/assets/images/favicons/favicon.png
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-Pluto-TV/tree/live-tv/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-Pluto-TV/issues
// @downloadURL  https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @updateURL    https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "redirect_to_webcast_reloaded": true,
  "force_http":                   true,
  "force_https":                  false
}

var strings = {
  "heading_controls":    "Download EPG Data",
  "label_from":          "From:",
  "label_to":            "To:",
  "button_refresh":      "Load/Refresh",

  "heading_filters":     "Filter Channels",
  "label_category":      "By Category:",
  "default_category":    "Show All",
  "label_name":          "By Name:",
  "button_filter":       "Apply",

  "heading_tools":       "Tools",
  "button_expand_all":   "Expand All",
  "button_collapse_all": "Collapse All",

  "episode_labels": {
    "title":             "title:",
    "summary":           "summary:",
    "time_start":        "starts at:",
    "time_stop":         "ends at:",
    "time_duration":     "duration:"
  },
  "episode_units": {
    "duration_hour":     "hour",
    "duration_hours":    "hours",
    "duration_minutes":  "minutes"
  }
}

var constants = {
  "debug":               false,
  "title":               "Pluto TV: Program Guide",
  "target_url": {
    "pathname":          "/careers",
    "hash":              "#live-tv"
  },
  "base_url": {
    "pathname":          "/live-tv",
    "href":              "https://pluto.tv/live-tv"
  },
  "dom_ids": {
    "div_root":          "PlutoTV_EPG",
    "div_controls":      "EPG_controls",
    "div_filters":       "EPG_filters",
    "div_tools":         "EPG_tools",
    "div_data":          "EPG_data",
    "select_from_date":  "from_date",
    "select_to_date":    "to_date",
    "select_category":   "channel_categories",
    "text_query":        "channel_search_query"
  },
  "dom_classes": {
    "data_loaded":       "loaded",
    "toggle_collapsed":  "collapsible_state_closed",
    "toggle_expanded":   "collapsible_state_opened",
    "div_heading":       "heading",
    "div_toggle":        "toggle_collapsible",
    "div_collapsible":   "collapsible",
    "div_webcast_icons": "icons-container"
  },
  "epg_url_qs": {
    "appVersion":        "5.17.0-38a9908bb8d8f15260d990bd00c1f6b49c7bba28",
    "deviceLat":         "38.8979",
    "deviceLon":         "-77.0365",
    "deviceMake":        "Chrome",
    "deviceVersion":     "90.0.4710.39"
  },
  "img_urls": {
    "icon_expand":       "https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es5/webmonkey-userscript/img/white.arrow_drop_down_circle.twotone.png",
    "icon_collapse":     "https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es5/webmonkey-userscript/img/white.expand_less.round.png"
  }
}

// ----------------------------------------------------------------------------- DOM: static skeleton

var reinitialize_dom = function() {
  var head = unsafeWindow.document.getElementsByTagName('head')[0]
  var body = unsafeWindow.document.body

  var html = {
    "head": [
      '<style>',

      // --------------------------------------------------- CSS: global

      'body {',
      '  background-color: #fff;',
      '  text-align: center;',
      '}',

      'body > * {',
      '  display: none !important;',
      '}',

      'body > #PlutoTV_EPG {',
      '  display: block !important;',
      '}',

      // --------------------------------------------------- CSS: EPG controls

      'body > #PlutoTV_EPG > #EPG_controls {',
      '  display: inline-block;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div {',
      '  margin: 1.25em 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_controls > div:first-child {',
      '  margin-top: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_controls > div:last-child {',
      '  margin-bottom: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div.right {',
      '  text-align: right;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div > h4 {',
      '  margin: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div > select,',
      'body > #PlutoTV_EPG > #EPG_controls > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div > select {',
      '  margin-left: 0.75em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_controls > div > select > option {',
      '  font-family: monospace;',
      '  text-align: right;',
      '}',

      // --------------------------------------------------- CSS: EPG filters

      'body > #PlutoTV_EPG > #EPG_filters {',
      '}',

      'body > #PlutoTV_EPG > #EPG_filters > div {',
      '  margin: 1.25em 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_filters > div:first-child {',
      '  margin-top: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_filters > div:last-child {',
      '  margin-bottom: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_filters > div > h4 {',
      '  margin: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_filters > div > input,',
      'body > #PlutoTV_EPG > #EPG_filters > div > select,',
      'body > #PlutoTV_EPG > #EPG_filters > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',

      'body > #PlutoTV_EPG > #EPG_filters > div > input,',
      'body > #PlutoTV_EPG > #EPG_filters > div > select {',
      '  margin-left: 0.75em;',
      '}',

      // --------------------------------------------------- CSS: EPG tools

      'body > #PlutoTV_EPG > #EPG_tools {',
      '}',

      'body > #PlutoTV_EPG > #EPG_tools > div {',
      '  margin: 1.25em 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_tools > div:first-child {',
      '  margin-top: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_tools > div:last-child {',
      '  margin-bottom: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_tools > div > h4 {',
      '  margin: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_tools > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',
      'body > #PlutoTV_EPG > #EPG_tools > div > button + button {',
      '  margin-left: 1.25em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_tools > div > button > * {',
      '  vertical-align: middle;',
      '}',
      'body > #PlutoTV_EPG > #EPG_tools > div > button > img {',
      '  display: inline-block;',
      '  background-color: #999;',
      '  margin-right: 0.5em;',
      '}',

      // --------------------------------------------------- CSS: EPG data

      'body > #PlutoTV_EPG > #EPG_data {',
      '  margin-top: 0.5em;',
      '  text-align: left;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div {',
      '  border: 1px solid #333;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.heading {',
      '  position: relative;',
      '  z-index: 1;',
      '  overflow: hidden;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.heading > h2 {',
      '  display: block;',
      '  margin: 0;',
      '  margin-right: 94px;',
      '  background-color: #ccc;',
      '  padding: 0.25em;',
      '  color: blue;',
      '  cursor: pointer;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.heading > div.toggle_collapsible {',
      '  display: block;',
      '  width: 94px;',
      '  background-color: #999;',
      '  position: absolute;',
      '  z-index: 1;',
      '  top: 0;',
      '  bottom: 0;',
      '  right: 0;',
      '  cursor: help;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible {',
      '  padding: 0.5em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible ul {',
      '  list-style: none;',
      '  margin: 0;',
      '  padding: 0;',
      '  padding-left: 1em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible ul > li {',
      '  list-style: none;',
      '  margin-top: 0.5em;',
      '  border-top: 1px solid #999;',
      '  padding-top: 0.5em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible ul > li > table td:first-child {',
      '  font-style: italic;',
      '  padding-right: 1em;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible ul > li > blockquote {',
      '  display: block;',
      '  background-color: #eee;',
      '  padding: 0.5em 1em;',
      '  margin: 0;',
      '}',

      // --------------------------------------------------- CSS: EPG data (collapsible toggle state)

      'body > #PlutoTV_EPG > #EPG_data > div > div.heading > div.toggle_collapsible {',
      '  background-repeat: no-repeat;',
      '  background-position: center;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div.collapsible_state_closed > div.heading > div.toggle_collapsible {',
      '  background-image: url("' + constants.img_urls.icon_expand + '");',
      '}',
      'body > #PlutoTV_EPG > #EPG_data > div.collapsible_state_closed > div.collapsible {',
      '  display: none;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div.collapsible_state_opened > div.heading > div.toggle_collapsible {',
      '  background-image: url("' + constants.img_urls.icon_collapse + '");',
      '}',
      'body > #PlutoTV_EPG > #EPG_data > div.collapsible_state_opened > div.collapsible {',
      '  display: block;',
      '}',

      // --------------------------------------------------- CSS: EPG data (links to tools on Webcast Reloaded website)

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container {',
      '  display: block;',
      '  position: relative;',
      '  z-index: 1;',
      '  float: right;',
      '  margin: 0.5em;',
      '  width: 60px;',
      '  height: 60px;',
      '  max-height: 60px;',
      '  vertical-align: top;',
      '  background-color: #d7ecf5;',
      '  border: 1px solid #000;',
      '  border-radius: 14px;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.chromecast,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.chromecast > img,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay > img,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.proxy,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.proxy > img,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.video-link,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.video-link > img {',
      '  display: block;',
      '  width: 25px;',
      '  height: 25px;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.chromecast,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.proxy,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.video-link {',
      '  position: absolute;',
      '  z-index: 1;',
      '  text-decoration: none;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.chromecast,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay {',
      '  top: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.proxy,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.video-link {',
      '  bottom: 0;',
      '}',

      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.chromecast,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.proxy {',
      '  left: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay,',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.video-link {',
      '  right: 0;',
      '}',
      'body > #PlutoTV_EPG > #EPG_data > div > div.collapsible > div.icons-container > a.airplay + a.video-link {',
      '  right: 17px; /* (60 - 25)/2 to center when there is no proxy icon */',
      '}',

      // --------------------------------------------------- CSS: separation between EPG sections

      'body > #PlutoTV_EPG > #EPG_filters,',
      'body > #PlutoTV_EPG > #EPG_tools,',
      'body > #PlutoTV_EPG > #EPG_data {',
      '  display: none;',
      '}',

      'body > #PlutoTV_EPG.loaded > #EPG_filters,',
      'body > #PlutoTV_EPG.loaded > #EPG_tools,',
      'body > #PlutoTV_EPG.loaded > #EPG_data {',
      '  display: block;',
      '  margin-top: 0.5em;',
      '  border-top: 1px solid #333;',
      '  padding-top: 0.5em;',
      '}',

      '</style>'
    ],
    "body": [
      '<div id="PlutoTV_EPG">',
      '  <div id="EPG_controls"></div>',
      '  <div id="EPG_filters"></div>',
      '  <div id="EPG_tools"></div>',
      '  <div id="EPG_data"></div>',
      '</div>'
    ]
  }

  head.innerHTML = '' + html.head.join("\n")
  body.innerHTML = '' + html.body.join("\n")

  unsafeWindow.document.title = constants.title
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - common

var make_element = function(elementName, html) {
  var el = unsafeWindow.document.createElement(elementName)

  if (html)
    el.innerHTML = html

  return el
}

var make_span = function(text) {return make_element('span', text)}
var make_h4   = function(text) {return make_element('h4',   text)}

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

  var select = make_element('select')

  select.setAttribute('id', (direction === -1) ? constants.dom_ids.select_from_date : constants.dom_ids.select_to_date)

  var date = new Date()
  var option, date_iso_string, date_obj, time_string
  var i = (direction === -1) ? 0 : 1
  var is_first_option = true

  for (; i <= count_30_min_blocks; i++) {
    option          = make_element('option')
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
  var from_date_iso_string = unsafeWindow.document.getElementById(constants.dom_ids.select_from_date).value
  var to_date_iso_string   = unsafeWindow.document.getElementById(constants.dom_ids.select_to_date).value

  if (from_date_iso_string && to_date_iso_string) {
    fetch_epg_url(from_date_iso_string, to_date_iso_string)
  }
}

var make_refresh_button = function() {
  var button = make_element('button')

  button.innerHTML = strings.button_refresh
  button.addEventListener("click", onclick_refresh_button)

  return button
}

var populate_dom_controls = function() {
  var count_30_min_blocks = 48 // 1 day
  var select_from         = make_date_select_element(count_30_min_blocks, -1)
  var select_to           = make_date_select_element(count_30_min_blocks,  1)
  var refresh_button      = make_refresh_button()
  var EPG_controls        = unsafeWindow.document.getElementById(constants.dom_ids.div_controls)
  var div

  EPG_controls.innerHTML  = ''

  div = make_element('div')
  div.appendChild(make_h4(strings.heading_controls))
  EPG_controls.appendChild(div)

  div = make_element('div')
  div.setAttribute('class', 'right')
  div.appendChild(make_span(strings.label_from))
  div.appendChild(select_from)
  EPG_controls.appendChild(div)

  div = make_element('div')
  div.setAttribute('class', 'right')
  div.appendChild(make_span(strings.label_to))
  div.appendChild(select_to)
  EPG_controls.appendChild(div)

  div = make_element('div')
  div.appendChild(refresh_button)
  EPG_controls.appendChild(div)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - filters

var active_filters = {
  "category":   "",
  "text_query": ""
}

var process_filters = function(category, text_query) {
  if ((active_filters.category === category) && (active_filters.text_query === text_query)) return

  active_filters.category   = category
  active_filters.text_query = text_query

  var EPG_data = unsafeWindow.document.getElementById(constants.dom_ids.div_data)
  var channel_divs = EPG_data.childNodes
  var channel_div, is_visible, category_id, channel_name

  for (var i=0; i < channel_divs.length; i++) {
    channel_div = channel_divs[i]

    if (channel_div && (channel_div instanceof HTMLElement) && (channel_div.nodeName === 'DIV')) {
      is_visible = true

      if (is_visible && category) {
        category_id = channel_div.getAttribute('x-category-id')

        if (category_id !== category)
          is_visible = false
      }

      if (is_visible && text_query) {
        channel_name = channel_div.getAttribute('x-channel-name')

        if (channel_name.indexOf(text_query) === -1)
          is_visible = false
      }

      channel_div.style.display = is_visible ? 'block' : 'none'
    }
  }
}

var onclick_filter_button = function() {
  var category   = unsafeWindow.document.getElementById(constants.dom_ids.select_category).value
  var text_query = unsafeWindow.document.getElementById(constants.dom_ids.text_query).value.toLowerCase()

  process_filters(category, text_query)
}

var make_filter_button = function() {
  var button = make_element('button')

  button.innerHTML = strings.button_filter
  button.addEventListener("click", onclick_filter_button)

  return button
}

var make_category_select_element = function() {
  var select = make_element('select')
  select.setAttribute('id', constants.dom_ids.select_category)
  return select
}

var make_text_query_input_element = function() {
  var input = make_element('input')
  input.setAttribute('id', constants.dom_ids.text_query)
  input.setAttribute('type', 'text')
  return input
}

var populate_dom_filters = function() {
  var select_category = make_category_select_element()
  var text_query      = make_text_query_input_element()
  var filter_button   = make_filter_button()
  var EPG_filters     = unsafeWindow.document.getElementById(constants.dom_ids.div_filters)
  var div

  EPG_filters.innerHTML  = ''

  div = make_element('div')
  div.appendChild(make_h4(strings.heading_filters))
  EPG_filters.appendChild(div)

  div = make_element('div')
  div.appendChild(make_span(strings.label_category))
  div.appendChild(select_category)
  EPG_filters.appendChild(div)

  div = make_element('div')
  div.appendChild(make_span(strings.label_name))
  div.appendChild(text_query)
  EPG_filters.appendChild(div)

  div = make_element('div')
  div.appendChild(filter_button)
  EPG_filters.appendChild(div)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - tools

var process_expand_or_collapse_all_button = function(expand, exclude_filtered_channels) {
  var EPG_data = unsafeWindow.document.getElementById(constants.dom_ids.div_data)
  var channel_divs = EPG_data.childNodes
  var channel_div, is_expanded, is_filtered_channel

  for (var i=0; i < channel_divs.length; i++) {
    channel_div = channel_divs[i]
    is_expanded = channel_div.classList.contains(constants.dom_classes.toggle_expanded)

    // short-circuit if nothing to do
    if (is_expanded == expand) continue

    if (exclude_filtered_channels) {
      is_filtered_channel = (channel_div.style.display === 'none')

      // short-circuit if filtered/nonvisible channels are excluded
      if (is_filtered_channel) continue
    }

    channel_div.className = (expand)
      ? constants.dom_classes.toggle_expanded
      : constants.dom_classes.toggle_collapsed
  }
}

var onclick_expand_all_button = function() {
  process_expand_or_collapse_all_button(true, false)
}

var onclick_collapse_all_button = function() {
  process_expand_or_collapse_all_button(false, false)
}

var make_expand_all_button = function() {
  var button = make_element('button')

  button.innerHTML = '<img src="' + constants.img_urls.icon_expand + '" /> ' + strings.button_expand_all
  button.addEventListener("click", onclick_expand_all_button)

  return button
}

var make_collapse_all_button = function() {
  var button = make_element('button')

  button.innerHTML = '<img src="' + constants.img_urls.icon_collapse + '" /> ' + strings.button_collapse_all
  button.addEventListener("click", onclick_collapse_all_button)

  return button
}

var populate_dom_tools = function() {
  var expand_all_button   = make_expand_all_button()
  var collapse_all_button = make_collapse_all_button()
  var EPG_tools           = unsafeWindow.document.getElementById(constants.dom_ids.div_tools)
  var div

  EPG_tools.innerHTML  = ''

  div = make_element('div')
  div.appendChild(make_h4(strings.heading_tools))
  EPG_tools.appendChild(div)

  div = make_element('div')
  div.appendChild(expand_all_button)
  div.appendChild(collapse_all_button)
  EPG_tools.appendChild(div)
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(hls_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.force_https

  var encoded_hls_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_hls_url       = encodeURIComponent(encodeURIComponent(btoa(hls_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : constants.base_url.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (hls_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_hls_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

var get_webcast_reloaded_url_chromecast_sender = function(hls_url, vtt_url, referer_url) {
  return get_webcast_reloaded_url(hls_url, vtt_url, referer_url, /* force_http= */ null, /* force_https= */ null).replace('/index.html', '/chromecast_sender.html')
}

var get_webcast_reloaded_url_airplay_sender = function(hls_url, vtt_url, referer_url) {
  return get_webcast_reloaded_url(hls_url, vtt_url, referer_url, /* force_http= */ true, /* force_https= */ false).replace('/index.html', '/airplay_sender.es5.html')
}

var get_webcast_reloaded_url_proxy = function(hls_url, vtt_url, referer_url) {
  return get_webcast_reloaded_url(hls_url, vtt_url, referer_url, /* force_http= */ true, /* force_https= */ false).replace('/index.html', '/proxy.html')
}

// ----------------------------------------------------------------------------- URL redirect

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if ((url[0] === '/') && (typeof GM_resolveUrl === 'function'))
      url = GM_resolveUrl(url, unsafeWindow.location.href)
    if (url.indexOf('http') === 0)
      GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!referer_url)
    referer_url = constants.base_url.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    return true
  }
  else if (user_options.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - EPG data

var onclick_channel_title = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var h2          = event.target
  var hls_url     = h2.getAttribute('x-hls-url')
  var referer_url = h2.getAttribute('x-referer-url')

  if (hls_url && referer_url) {
    process_hls_url(hls_url, /* vtt_url= */ null, referer_url)
  }
}

var onclick_channel_toggle = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var toggle_div = event.target
  if (!toggle_div || !(toggle_div instanceof HTMLElement)) return

  var channel_div = toggle_div.parentNode.parentNode
  if (!channel_div || !(channel_div instanceof HTMLElement)) return

  channel_div.className = (channel_div.classList.contains(constants.dom_classes.toggle_expanded))
    ? constants.dom_classes.toggle_collapsed
    : constants.dom_classes.toggle_expanded
}

var convert_ms_to_mins = function(X) {
  // (X ms)(1 sec / 1000 ms)(1 min / 60 sec)
  return Math.ceil(X / 60000)
}

var get_ms_duration_time_string = function(ms) {
  var time_string = ''
  var mins = convert_ms_to_mins(ms)
  var hours

  if (mins >= 60) {
    hours       = Math.floor(mins / 60)
    time_string = hours + ' ' + ((hours < 2) ? strings.episode_units.duration_hour : strings.episode_units.duration_hours) + ', '
    mins        = mins % 60
  }

  return time_string + mins + ' ' + strings.episode_units.duration_minutes
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
    dates.str.start = temp.toLocaleDateString() + ' ' + get_12_hour_time_string(temp, '&nbsp;')
  }

  if (data.stop) {
    temp           = new Date(data.stop)
    dates.obj.stop = temp
    dates.str.stop = temp.toLocaleDateString() + ' ' + get_12_hour_time_string(temp, '&nbsp;')
  }

  if (data.duration) {
    dates.str.duration = get_ms_duration_time_string(data.duration)
  }

  var tr = []

  var append_tr = function(td, colspan) {
    if (Array.isArray(td))
      tr.push('<tr><td>' + td.join('</td><td>') + '</td></tr>')
    else if ((typeof colspan === 'number') && (colspan > 1))
      tr.push('<tr><td colspan="' + colspan + '">' + td + '</td></tr>')
    else
      tr.push('<tr><td>' + td + '</td></tr>')
  }

  if (data.title)
    append_tr([strings.episode_labels.title, data.title])
  if (dates.str.start)
    append_tr([strings.episode_labels.time_start, dates.str.start])
  if (dates.str.stop)
    append_tr([strings.episode_labels.time_stop, dates.str.stop])
  if (dates.str.duration)
    append_tr([strings.episode_labels.time_duration, dates.str.duration])
  if (data.description)
    append_tr(strings.episode_labels.summary, 2)

  var html = [
    '<table>' + tr.join("\n") + '</table>',
    '<blockquote>' + data.description + '</blockquote>'
  ]

  return '<li>' + html.join("\n") + '</li>'
}

var make_webcast_reloaded_div = function(hls_url, referer_url) {
  var webcast_reloaded_urls = {
    "icons_basepath":    'https://github.com/warren-bank/crx-webcast-reloaded/raw/gh-pages/chrome_extension/2-release/popup/img/',
//  "index":             get_webcast_reloaded_url(                  hls_url, /* vtt_url= */ null, referer_url),
    "chromecast_sender": get_webcast_reloaded_url_chromecast_sender(hls_url, /* vtt_url= */ null, referer_url),
    "airplay_sender":    get_webcast_reloaded_url_airplay_sender(   hls_url, /* vtt_url= */ null, referer_url),
    "proxy":             get_webcast_reloaded_url_proxy(            hls_url, /* vtt_url= */ null, referer_url)
  }

  var div = make_element('div')

  var html = [
    '<a target="_blank" class="chromecast" href="' + webcast_reloaded_urls.chromecast_sender + '" title="Chromecast Sender"><img src="'       + webcast_reloaded_urls.icons_basepath + 'chromecast.png"></a>',
    '<a target="_blank" class="airplay" href="'    + webcast_reloaded_urls.airplay_sender    + '" title="ExoAirPlayer Sender"><img src="'     + webcast_reloaded_urls.icons_basepath + 'airplay.png"></a>',
    '<a target="_blank" class="proxy" href="'      + webcast_reloaded_urls.proxy             + '" title="HLS-Proxy Configuration"><img src="' + webcast_reloaded_urls.icons_basepath + 'proxy.png"></a>',
    '<a target="_blank" class="video-link" href="' + hls_url                                 + '" title="direct link to video"><img src="'    + webcast_reloaded_urls.icons_basepath + 'video_link.png"></a>'
  ]

  div.setAttribute('class', constants.dom_classes.div_webcast_icons)
  div.innerHTML = html.join("\n")

  return div
}

var insert_webcast_reloaded_div = function(channel_div, hls_url, referer_url) {
  var webcast_reloaded_div = make_webcast_reloaded_div(hls_url, referer_url)
  var collapsible_div      = channel_div.querySelector(':scope > div.' + constants.dom_classes.div_collapsible)

  collapsible_div.insertBefore(webcast_reloaded_div, collapsible_div.childNodes[0])
}

var active_channel_categories = {}

var make_channel_div = function(data) {
  var slug, categoryID, name, summary, hls_url, referer_url, episodes, div, html
  var temp, temp2

  slug = data.slug
  if (!slug) slug = ''

  categoryID = data.categoryID
  if (categoryID)
    active_channel_categories[categoryID] = true
  else
    categoryID = ''

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

  referer_url = 'https://pluto.tv/live-tv/' + slug

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

  div = make_element('div')

  html = [
    '<div class="' + constants.dom_classes.div_heading + '">',
    '  <h2 x-hls-url="' + hls_url + '" x-referer-url="' + referer_url + '">' + name + '</h2>',
    '  <div class="' + constants.dom_classes.div_toggle + '"></div>',
    '</div>',
    '<div class="' + constants.dom_classes.div_collapsible + '">',
    '  <div>' + summary + '</div>',
    '  <ul>' + episodes.map(make_episode_listitem_html).join("\n") + '</ul>',
    '</div>'
  ]

  div.setAttribute('class', constants.dom_classes.toggle_collapsed)
  div.setAttribute('x-category-id',  categoryID)
  div.setAttribute('x-channel-name', name.toLowerCase())
  div.innerHTML = html.join("\n")
  div.querySelector(':scope > div.' + constants.dom_classes.div_heading + ' > h2').addEventListener("click", onclick_channel_title)
  div.querySelector(':scope > div.' + constants.dom_classes.div_heading + ' > div.' + constants.dom_classes.div_toggle).addEventListener("click", onclick_channel_toggle)

  insert_webcast_reloaded_div(div, hls_url, referer_url)

  return div
}

var populate_category_select_filter = function(categories) {
  var select = unsafeWindow.document.getElementById(constants.dom_ids.select_category)
  var option, category

  select.innerHTML = ''

  option = make_element('option')
  option.setAttribute('selected', 'selected')
  option.setAttribute('value', '')
  option.innerHTML = strings.default_category
  select.appendChild(option)

  if (!categories || !Array.isArray(categories) || !categories.length) return

  for (var i=0; i < categories.length; i++) {
    category = categories[i]

    if (category && (typeof category === 'object') && category.id && active_channel_categories[category.id] && category.name && (category.name !== 'Empty Category')) {
      option = make_element('option')
      option.setAttribute('value', category.id)
      option.innerHTML = category.name
      select.appendChild(option)
    }
  }
}

var process_epg_data = function(data) {
  var EPG_root = unsafeWindow.document.getElementById(constants.dom_ids.div_root)
  var EPG_data = unsafeWindow.document.getElementById(constants.dom_ids.div_data)

  EPG_root.className = ''
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

  populate_category_select_filter(data.categories)

  EPG_root.className = constants.dom_classes.data_loaded
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

var prevent_history_redirects = function() {
  if (unsafeWindow.history) {
    unsafeWindow.history.pushState    = function(){}
    unsafeWindow.history.replaceState = function(){}
  }
}

var init = function() {
  if (('function' === (typeof GM_getUrl)) && (GM_getUrl() !== unsafeWindow.location.href)) return

  var pathname = unsafeWindow.location.pathname
  var hash     = unsafeWindow.location.hash

  if ((pathname.indexOf(constants.target_url.pathname) >= 0) && (hash === constants.target_url.hash)) {
    prevent_history_redirects()
    reinitialize_dom()
    populate_dom_controls()
    populate_dom_filters()
    populate_dom_tools()
  }
  else if (pathname.indexOf(constants.base_url.pathname) >= 0) {
    redirect_to_url(constants.target_url.pathname + constants.target_url.hash)
  }
}

init()

// -----------------------------------------------------------------------------
