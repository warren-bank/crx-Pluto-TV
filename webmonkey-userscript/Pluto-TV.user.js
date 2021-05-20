// ==UserScript==
// @name         Pluto TV: on-demand
// @description  Watch on-demand videos in external player.
// @version      1.0.1
// @match        *://pluto.tv/*
// @match        *://*.pluto.tv/*
// @icon         https://pluto.tv/assets/images/favicons/favicon.png
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-Pluto-TV/tree/on-demand/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-Pluto-TV/issues
// @downloadURL  https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @updateURL    https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "redirect_to_webcast_reloaded":     true,
  "force_http":                       true,
  "force_https":                      false,

  // 0: silent
  // 1: more important
  // 9: less important
  "debug_verbosity":                  0
}

var strings = {
  "heading_filters":                  "Filter Channels",
  "label_type":                       "By Type:",
  "label_category":                   "By Genre:",
  "types": {
    "shows":                          "Television",
    "movies":                         "Movies"
  },
  "default_type":                     "Show All",
  "default_category":                 "Show All",
  "label_name":                       "By Name:",
  "button_filter":                    "Apply",

  "heading_tools":                    "Tools",
  "button_expand_all":                "Expand All",
  "button_collapse_all":              "Collapse All",
  "button_clear_cache":               "Clear Persistent Cache",
  "button_reload":                    "Reload",

  "button_download_episodes":         "List All Episodes",
  "button_start_video":               "Start Video",

  "episode_labels": {
    "title":                          "title:",
    "summary":                        "summary:",
    "time_duration":                  "duration:"
  },
  "episode_units": {
    "duration_hour":                  "hour",
    "duration_hours":                 "hours",
    "duration_minutes":               "minutes"
  },
  "cache_units": {
    "item":                           "item",
    "items":                          "items"
  }
}

var constants = {
  "debug":                            false,
  "assert_video_url_convention":      true,
  "title":                            "Pluto TV: On-Demand Video Program Guide",
  "target_url": {
    "pathname":                       "/careers",
    "hash":                           "#on-demand"
  },
  "base_url": {
    "pathname":                       "/on-demand",
    "href":                           "https://pluto.tv/on-demand"
  },
  "dom_ids": {
    "div_root":                       "PlutoTV_EPG",
    "div_filters":                    "EPG_filters",
    "div_tools":                      "EPG_tools",
    "div_data":                       "EPG_data",
    "select_type":                    "channel_types",
    "select_category":                "channel_categories",
    "text_query":                     "channel_search_query"
  },
  "dom_classes": {
    "data_loaded":                    "loaded",
    "toggle_collapsed":               "collapsible_state_closed",
    "toggle_expanded":                "collapsible_state_opened",
    "div_heading":                    "heading",
    "div_toggle":                     "toggle_collapsible",
    "div_collapsible":                "collapsible",
    "div_episodes":                   "episodes",
    "div_webcast_icons":              "icons-container"
  },
  "epg_url_qs": {
    "appVersion":                     "5.17.0-38a9908bb8d8f15260d990bd00c1f6b49c7bba28",
    "deviceLat":                      "38.8979",
    "deviceLon":                      "-77.0365",
    "deviceMake":                     "Chrome",
    "deviceVersion":                  "90.0.4710.39"
  },
  "img_urls": {
    "icon_expand":                    "https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/img/white.arrow_drop_down_circle.twotone.png",
    "icon_collapse":                  "https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/img/white.expand_less.round.png",
    "icon_delete":                    "https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/img/white.delete_forever.twotone.png",
    "icon_refresh":                   "https://github.com/warren-bank/crx-Pluto-TV/raw/on-demand/webmonkey-userscript/es5/webmonkey-userscript/img/white.refresh.baseline.png",
    "base_webcast_reloaded_icons":    "https://github.com/warren-bank/crx-webcast-reloaded/raw/gh-pages/chrome_extension/2-release/popup/img/"
  },
  "cache_keys": {
    "epg_data":                       "epg_data",
    "epg_data_count":                 "epg_data_count"
  }
}

var state = {
  "device": {
    "id":    null
  },
  "session": {
    "id":    null,
    "token": null
  }
}

// ----------------------------------------------------------------------------- debug

var debug = function(level, message) {
  if (!user_options.debug_verbosity || (user_options.debug_verbosity < level)) return

  if (typeof message === 'function')
    message = message()
  if (!message)
    return

  if (typeof GM_toastShort === 'function')
    GM_toastShort(message)
  else
    unsafeWindow.alert(message)
}

// ----------------------------------------------------------------------------- helpers

// make GET request, parse JSON response, pass data to callback
var download_json = function(url, headers, callback) {
  var xhr = new unsafeWindow.XMLHttpRequest()
  xhr.open("GET", url, true, null, null)

  if (headers && (typeof headers === 'object')) {
    debug(5, 'xhr headers:' + "\n" + JSON.stringify(headers, null, 2))

    var keys = Object.keys(headers)
    var key, val
    for (var i=0; i < keys.length; i++) {
      key = keys[i]
      val = headers[key]
      xhr.setRequestHeader(key, val)
    }
  }

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          debug(5, 'xhr response:' + "\n" + xhr.responseText)

          var json_data = JSON.parse(xhr.responseText)
          callback(json_data)
        }
        catch(error) {
          debug(1, 'xhr error:' + "\n" + error.message)
        }
      }
    }
  }

  xhr.send()
}

// -----------------------------------------------------------------------------

// https://stackoverflow.com/a/2117523
var generate_uuidv4 = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0
    var v = (c == 'x') ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// -----------------------------------------------------------------------------

var repeat_string = function(str, count) {
  var rep = ''
  for (var i=0; i < count; i++)
    rep += str
  return rep
}

var pad_zeros = function(num, len) {
  var str = num.toString()
  var pad = len - str.length
  if (pad > 0)
    str = repeat_string('0', pad) + str
  return str
}

// -----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
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
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

var get_webcast_reloaded_url_chromecast_sender = function(video_url, vtt_url, referer_url) {
  return get_webcast_reloaded_url(video_url, vtt_url, referer_url, /* force_http= */ null, /* force_https= */ null).replace('/index.html', '/chromecast_sender.html')
}

var get_webcast_reloaded_url_airplay_sender = function(video_url, vtt_url, referer_url) {
  return get_webcast_reloaded_url(video_url, vtt_url, referer_url, /* force_http= */ true, /* force_https= */ false).replace('/index.html', '/airplay_sender.es5.html')
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

// -----------------------------------------------------------------------------

var get_api_session_video_url = function(path) {
  if (!path || ('/' !== path[0])) return path

  var uuids = {
    "device":  state.device.id  || generate_uuidv4(),
    "session": state.session.id || generate_uuidv4()
  }

  var api_qs = [
    'appVersion='    + constants.epg_url_qs.appVersion,
    'sid='           + uuids.session,
    'deviceId='      + uuids.device,
    'deviceLat='     + constants.epg_url_qs.deviceLat,
    'deviceLon='     + constants.epg_url_qs.deviceLon,
    'deviceMake='    + constants.epg_url_qs.deviceMake,
    'deviceVersion=' + constants.epg_url_qs.deviceVersion,
    'deviceDNT=false',
    'deviceModel=web',
    'deviceType=web',
    'appName=web',
    'includeExtendedEvents=false',
    'marketingRegion=US',
    'advertisingId=',
    'userId=',
    'appStoreUrl=',
    'architecture=',
    'buildVersion='
  ]

  var video_url = 'https://service-stitcher.clusters.pluto.tv' + path + '?' + api_qs.join('&')
  return video_url
}

var get_api_session_video_url_convention = function(video_id) {
  if (!video_id) return null

  var path = '/stitch/hls/episode/' + video_id + '/master.m3u8'

  return get_api_session_video_url(path)
}

// ----------------------------------------------------------------------------- EPG: download data

var fetch_api_session_token = function(callback) {
  state.device.id = generate_uuidv4()

  var api_qs = [
    'appVersion='    + constants.epg_url_qs.appVersion,
    'appName=web',
    'clientModelNumber=na',
    'clientID='      + state.device.id,
    'deviceId='      + state.device.id,
    'deviceMake='    + constants.epg_url_qs.deviceMake,
    'deviceVersion=' + constants.epg_url_qs.deviceVersion,
    'deviceModel=web',
    'deviceType=web',
    'serverSideAds=false',
    'DNT=0',
    'channelID=',
    'channelSlug=',
    'episodeSlugs='
  ]

  var api_url = 'https://boot.pluto.tv/v4/start?' + api_qs.join('&')

  var api_headers = null

  var api_callback = function(data) {
    if (data && ('object' === (typeof data)) && data.session && ('object' === (typeof data.session)) && data.session.sessionID && data.sessionToken) {
      state.session.id    = data.session.sessionID
      state.session.token = data.sessionToken

      callback()
    }
  }

  download_json(api_url, api_headers, api_callback)
}

var fetch_api_session_json = function(url, headers, callback) {
  if (!state.session.token) return

  if (!headers) headers = {}

  headers["access-control-request-headers"] = "authorization,content-type"
  headers["authorization"]                  = "Bearer " + state.session.token
  headers["content-type"]                   = "application/json"

  download_json(url, headers, callback)
}

var fetch_api_session_categories = function(callback) {
  if (!state.session.token) return

  var api_qs = [
    'includeItems=false',
    'includeCategoryFields=',
    'offset=1000',
    'page=1',
    'sort=number%3Aasc'
  ]

  var api_url = 'https://service-vod.clusters.pluto.tv/v4/vod/categories?' + api_qs.join('&')

  var api_headers = null

  var api_callback = function(data) {
    if (data && ('object' === (typeof data)) && Array.isArray(data.categories) && data.categories.length) {
      var category_ids = []
      var category

      for (var i=0; i < data.categories.length; i++) {
        category = data.categories[i]

        if (category && ('object' === (typeof category)) && !category.plutoOfficeOnly && category._id)
          category_ids.push(category._id)
      }

      if (category_ids.length)
        callback(category_ids)
    }
  }

  fetch_api_session_json(api_url, api_headers, api_callback)
}

var fetch_api_session_category_items = function(category_id, callback) {
  if (!state.session.token) return

  var api_qs = [
    'offset=30',
    'page=1'
  ]

  var api_url = 'https://service-vod.clusters.pluto.tv/v4/vod/categories/' + category_id + '/items?' + api_qs.join('&')

  var api_headers = null

  var api_callback = function(data) {
    if (data && ('object' === (typeof data)) && Array.isArray(data.items) && data.items.length) {
      var items = {shows: [], movies: []}
      var item, item_type, new_item

      for (var i=0; i < data.items.length; i++) {
        item      = data.items[i]
        item_type = null

        if (item && ('object' === (typeof item)) && item._id && item.type) {
          if ((item.type === 'movie') || (item.type === 'series')) {
            new_item  = {
              ID:          item._id,
              Title:       item.name,
              Genre:       item.genre,
              Description: item.description
            }

            if (item.type === 'movie') {
              if (constants.assert_video_url_convention || (item.stitched && item.stitched.path)) {
                item_type = 'movies'

                new_item.DurationInMS = item.duration || item.originalContentDuration || 0

                if (!constants.assert_video_url_convention)
                  new_item.VideoPath = item.stitched.path
              }
            }
            else if (item.type === 'series') {
              item_type = 'shows'
            }

            if (item_type && Array.isArray(items[item_type]))
              items[item_type].push(new_item)
          }
        }
      }

      if (items.shows.length || items.movies.length)
        callback(items)
    }
  }

  fetch_api_session_json(api_url, api_headers, api_callback)
}

var fetch_api_session_series_episodes = function(series_id, callback) {
  var uuids = {
    "device":  state.device.id  || generate_uuidv4(),
    "session": state.session.id || generate_uuidv4()
  }

  var api_qs = [
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

  var api_url = 'https://service-vod.clusters.pluto.tv/v3/vod/series/' + series_id + '/seasons?' + api_qs.join('&')

  var api_headers = null

  var api_callback = function(data) {
    if (data && ('object' === (typeof data)) && Array.isArray(data.seasons) && data.seasons.length) {
      var episodes = []
      var season, episode, new_episode, url

      for (var i=0; i < data.seasons.length; i++) {
        season = data.seasons[i]

        if (season && ('object' === (typeof season)) && Array.isArray(season.episodes) && season.episodes.length) {
          for (var i2=0; i2 < season.episodes.length; i2++) {
            episode = season.episodes[i2]

            if (episode && ('object' === (typeof episode)) && episode._id) {
              if (constants.assert_video_url_convention || (episode.stitched && ('object' === (typeof episode.stitched)) && Array.isArray(episode.stitched.urls) && episode.stitched.urls)) {
                new_episode = {
                  ID:           episode._id,
                  ShowName:     data.name,
                  Season:       season.number || episode.season || 0,
                  Episode:      episode.number || 0,
                  Title:        episode.name,
                  Description:  episode.description,
                  DurationInMS: episode.duration || 0
                }

                if (!constants.assert_video_url_convention) {
                  for (var i3=0; i3 < episode.stitched.urls; i3++) {
                    url = episode.stitched.urls[i3]

                    if (url && ('object' === (typeof url)) && (url.type === 'hls') && url.url) {
                      new_episode.VideoPath = url.url
                      break
                    }
                  }
                }

                episodes.push(new_episode)
              }
            }
          }
        }
      }

      if (episodes.length)
        callback(episodes)
    }
  }

  // doesn't require session token
  download_json(api_url, api_headers, api_callback)
}

// -----------------------------------------------------------------------------

var get_video_data = function(video) {
  var video_url, video_type, vtt_url

  video_url  = constants.assert_video_url_convention
    ? get_api_session_video_url_convention(video.ID)
    : get_api_session_video_url(episode.VideoPath)
  video_type = 'application/x-mpegurl'
  vtt_url    = ''

  return {video_url: video_url, video_type: video_type, vtt_url: vtt_url}
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

      'a {',
      '  display: block;',
      '  margin: 0;',
      '  color: blue;',
      '  text-decoration: none;',
      '}',

      // --------------------------------------------------- CSS: EPG filters

      '#EPG_filters {',
      '}',

      '#EPG_filters > div {',
      '  margin: 1.25em 0;',
      '}',
      '#EPG_filters > div:first-child {',
      '  margin-top: 0;',
      '}',
      '#EPG_filters > div:last-child {',
      '  margin-bottom: 0;',
      '}',

      '#EPG_filters > div > h4 {',
      '  margin: 0;',
      '}',

      '#EPG_filters > div > input,',
      '#EPG_filters > div > select,',
      '#EPG_filters > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',

      '#EPG_filters > div > input,',
      '#EPG_filters > div > select {',
      '  margin-left: 0.75em;',
      '}',

      // --------------------------------------------------- CSS: EPG tools

      '#EPG_tools {',
      '}',

      '#EPG_tools > div {',
      '  margin: 1.25em 0;',
      '}',
      '#EPG_tools > div:first-child {',
      '  margin-top: 0;',
      '}',
      '#EPG_tools > div:last-child {',
      '  margin-bottom: 0;',
      '}',

      '#EPG_tools > div > h4 {',
      '  margin: 0;',
      '}',

      '#EPG_tools > div > button {',
      '  display: inline-block;',
      '  margin: 0px;',
      '}',
      '#EPG_tools > div > button + button {',
      '  margin-left: 1.25em;',
      '}',

      '#EPG_tools > div > button > * {',
      '  vertical-align: middle;',
      '}',
      '#EPG_tools > div > button > img {',
      '  display: inline-block;',
      '  background-color: #999;',
      '  margin-right: 0.5em;',
      '}',

      // --------------------------------------------------- CSS: EPG data

      '#EPG_data {',
      '  margin-top: 0.5em;',
      '  text-align: left;',
      '}',

      '#EPG_data > div {',
      '  border: 1px solid #333;',
      '}',

      '#EPG_data > div > div.heading {',
      '  position: relative;',
      '  z-index: 1;',
      '  overflow: hidden;',
      '}',

      '#EPG_data > div > div.heading > h2 {',
      '  display: block;',
      '  margin: 0;',
      '  margin-right: 94px;',
      '  background-color: #ccc;',
      '  padding: 0.25em;',
      '}',

      '#EPG_data > div > div.heading > div.toggle_collapsible {',
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

      '#EPG_data > div > div.collapsible {',
      '  padding: 0.5em;',
      '}',

      '#EPG_data > div > div.collapsible > div.icons-container {',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul {',
      '  list-style: none;',
      '  margin: 0;',
      '  padding: 0;',
      '  padding-left: 1em;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li {',
      '  list-style: none;',
      '  margin-top: 0.5em;',
      '  border-top: 1px solid #999;',
      '  padding-top: 0.5em;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li > table {',
      '  min-height: 70px;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li > table td:first-child {',
      '  font-style: italic;',
      '  padding-right: 1em;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li > blockquote {',
      '  display: block;',
      '  background-color: #eee;',
      '  padding: 0.5em 1em;',
      '  margin: 0;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li > button {',
      '  margin: 0.75em 0;',
      '}',

      '#EPG_data > div > div.collapsible div.episodes > ul > li > div.icons-container {',
      '}',

      // --------------------------------------------------- CSS: EPG data (collapsible toggle state)

      '#EPG_data > div > div.heading > div.toggle_collapsible {',
      '  background-repeat: no-repeat;',
      '  background-position: center;',
      '}',

      '#EPG_data > div.collapsible_state_closed > div.heading > div.toggle_collapsible {',
      '  background-image: url("' + constants.img_urls.icon_expand + '");',
      '}',
      '#EPG_data > div.collapsible_state_closed > div.collapsible {',
      '  display: none;',
      '}',

      '#EPG_data > div.collapsible_state_opened > div.heading > div.toggle_collapsible {',
      '  background-image: url("' + constants.img_urls.icon_collapse + '");',
      '}',
      '#EPG_data > div.collapsible_state_opened > div.collapsible {',
      '  display: block;',
      '}',

      // --------------------------------------------------- CSS: EPG data (links to tools on Webcast Reloaded website)

      '#EPG_data > div > div.collapsible div.icons-container {',
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

      '#EPG_data > div > div.collapsible div.icons-container > a.chromecast,',
      '#EPG_data > div > div.collapsible div.icons-container > a.chromecast > img,',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay,',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay > img,',
      '#EPG_data > div > div.collapsible div.icons-container > a.proxy,',
      '#EPG_data > div > div.collapsible div.icons-container > a.proxy > img,',
      '#EPG_data > div > div.collapsible div.icons-container > a.video-link,',
      '#EPG_data > div > div.collapsible div.icons-container > a.video-link > img {',
      '  display: block;',
      '  width: 25px;',
      '  height: 25px;',
      '}',

      '#EPG_data > div > div.collapsible div.icons-container > a.chromecast,',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay,',
      '#EPG_data > div > div.collapsible div.icons-container > a.proxy,',
      '#EPG_data > div > div.collapsible div.icons-container > a.video-link {',
      '  position: absolute;',
      '  z-index: 1;',
      '  text-decoration: none;',
      '}',

      '#EPG_data > div > div.collapsible div.icons-container > a.chromecast,',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay {',
      '  top: 0;',
      '}',
      '#EPG_data > div > div.collapsible div.icons-container > a.proxy,',
      '#EPG_data > div > div.collapsible div.icons-container > a.video-link {',
      '  bottom: 0;',
      '}',

      '#EPG_data > div > div.collapsible div.icons-container > a.chromecast,',
      '#EPG_data > div > div.collapsible div.icons-container > a.proxy {',
      '  left: 0;',
      '}',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay,',
      '#EPG_data > div > div.collapsible div.icons-container > a.video-link {',
      '  right: 0;',
      '}',
      '#EPG_data > div > div.collapsible div.icons-container > a.airplay + a.video-link {',
      '  right: 17px; /* (60 - 25)/2 to center when there is no proxy icon */',
      '}',

      // --------------------------------------------------- CSS: separation between EPG sections

      '#PlutoTV_EPG > #EPG_filters,',
      '#PlutoTV_EPG > #EPG_tools,',
      '#PlutoTV_EPG > #EPG_data {',
      '  display: none;',
      '}',

      '#PlutoTV_EPG.loaded > #EPG_filters,',
      '#PlutoTV_EPG.loaded > #EPG_tools,',
      '#PlutoTV_EPG.loaded > #EPG_data {',
      '  display: block;',
      '}',

      '#PlutoTV_EPG.loaded > #EPG_tools,',
      '#PlutoTV_EPG.loaded > #EPG_data {',
      '  margin-top: 0.5em;',
      '  border-top: 1px solid #333;',
      '  padding-top: 0.5em;',
      '}',

      '</style>'
    ],
    "body": [
      '<div id="PlutoTV_EPG">',
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

// ----------------------------------------------------------------------------- DOM: dynamic elements - filters

var active_filters = {
  "type":       "",
  "category":   "",
  "text_query": ""
}

var process_filters = function(type, category, text_query) {
  if ((active_filters.type === type) && (active_filters.category === category) && (active_filters.text_query === text_query)) return

  active_filters.type       = type
  active_filters.category   = category
  active_filters.text_query = text_query

  var EPG_data = unsafeWindow.document.getElementById(constants.dom_ids.div_data)
  var channel_divs = EPG_data.childNodes
  var channel_div, is_visible, type_id, category_id, channel_name

  for (var i=0; i < channel_divs.length; i++) {
    channel_div = channel_divs[i]

    if (channel_div && (channel_div instanceof HTMLElement) && (channel_div.nodeName === 'DIV')) {
      is_visible = true

      if (is_visible && type) {
        type_id = channel_div.getAttribute('x-type-id')

        if (type_id !== type)
          is_visible = false
      }

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

var onclick_filter_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var type       = unsafeWindow.document.getElementById(constants.dom_ids.select_type).value
  var category   = unsafeWindow.document.getElementById(constants.dom_ids.select_category).value
  var text_query = unsafeWindow.document.getElementById(constants.dom_ids.text_query).value.toLowerCase()

  process_filters(type, category, text_query)
}

var make_filter_button = function() {
  var button = make_element('button')

  button.innerHTML = strings.button_filter
  button.addEventListener("click", onclick_filter_button)

  return button
}

var make_type_select_element = function() {
  var select = make_element('select')
  select.setAttribute('id', constants.dom_ids.select_type)
  return select
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
  var select_type     = make_type_select_element()
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
  div.appendChild(make_span(strings.label_type))
  div.appendChild(select_type)
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

var onclick_expand_all_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  process_expand_or_collapse_all_button(true, false)
}

var onclick_collapse_all_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  process_expand_or_collapse_all_button(false, false)
}

var onclick_clear_cache_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  epg_data_cache.clear_persistent_storage()

  // enable the reload button
  var clear_cache_button = event.target
  var reload_button      = clear_cache_button.nextSibling

  if (reload_button instanceof HTMLButtonElement)
    reload_button.disabled = false
}

var onclick_reload_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  unsafeWindow.location.reload()
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

var make_clear_cache_button = function() {
  var is_enabled = epg_data_cache.is_persistent_storage_available()
  var item_count = epg_data_cache.get_item_count_in_persistent_storage()

  var get_item_count_string = function(item_count) {
    if (item_count > 0)
      return ' (' + item_count + ' ' + ((item_count === 1) ? strings.cache_units.item : strings.cache_units.items) + ')'
    else
      return ''
  }

  var button = make_element('button')

  button.innerHTML = '<img src="' + constants.img_urls.icon_delete + '" /> ' + strings.button_clear_cache + get_item_count_string(item_count)

  if (is_enabled) {
    button.addEventListener("click", onclick_clear_cache_button)

    unsafeWindow.addEventListener('message', function(event) {
      if (event.data && (typeof event.data === 'object') && (typeof event.data.new_item_count_in_persistent_storage === 'number')) {
        var new_item_count = event.data.new_item_count_in_persistent_storage
        var html = button.innerHTML

        // update new item count
        html = html.replace(/ \(.*$/, '') + get_item_count_string(new_item_count)

        button.innerHTML = html
      }
    })
  }
  else {
    button.disabled = true
  }

  return button
}

var make_reload_button = function() {
  var button = make_element('button')

  button.innerHTML = '<img src="' + constants.img_urls.icon_refresh + '" /> ' + strings.button_reload
  button.addEventListener("click", onclick_reload_button)
  button.disabled = true

  return button
}

var populate_dom_tools = function() {
  var expand_all_button   = make_expand_all_button()
  var collapse_all_button = make_collapse_all_button()
  var clear_cache_button  = make_clear_cache_button()
  var reload_button       = make_reload_button()
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

  div = make_element('div')
  div.appendChild(clear_cache_button)
  div.appendChild(reload_button)
  EPG_tools.appendChild(div)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - URL links to tools on Webcast Reloaded website

var make_webcast_reloaded_div = function(video_url, vtt_url, referer_url) {
  var webcast_reloaded_urls = {
//  "index":             get_webcast_reloaded_url(                  video_url, vtt_url, referer_url),
    "chromecast_sender": get_webcast_reloaded_url_chromecast_sender(video_url, vtt_url, referer_url),
    "airplay_sender":    get_webcast_reloaded_url_airplay_sender(   video_url, vtt_url, referer_url),
    "proxy":             get_webcast_reloaded_url_proxy(            video_url, vtt_url, referer_url)
  }

  var div = make_element('div')

  var html = [
    '<a target="_blank" class="chromecast" href="' + webcast_reloaded_urls.chromecast_sender + '" title="Chromecast Sender"><img src="'       + constants.img_urls.base_webcast_reloaded_icons + 'chromecast.png"></a>',
    '<a target="_blank" class="airplay" href="'    + webcast_reloaded_urls.airplay_sender    + '" title="ExoAirPlayer Sender"><img src="'     + constants.img_urls.base_webcast_reloaded_icons + 'airplay.png"></a>',
    '<a target="_blank" class="proxy" href="'      + webcast_reloaded_urls.proxy             + '" title="HLS-Proxy Configuration"><img src="' + constants.img_urls.base_webcast_reloaded_icons + 'proxy.png"></a>',
    '<a target="_blank" class="video-link" href="' + video_url                                 + '" title="direct link to video"><img src="'    + constants.img_urls.base_webcast_reloaded_icons + 'video_link.png"></a>'
  ]

  div.setAttribute('class', constants.dom_classes.div_webcast_icons)
  div.innerHTML = html.join("\n")

  return div
}

var insert_webcast_reloaded_div = function(block_element, video_url, vtt_url, referer_url) {
  var webcast_reloaded_div = make_webcast_reloaded_div(video_url, vtt_url, referer_url)

  if (block_element.childNodes.length)
    block_element.insertBefore(webcast_reloaded_div, block_element.childNodes[0])
  else
    block_element.appendChild(webcast_reloaded_div)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - EPG data - 2nd pass (manual, list all episodes in one chosen TV series)

var onclick_start_video_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var button     = event.target
  var video_url  = button.getAttribute('x-video-url')
  var video_type = button.getAttribute('x-video-type')
  var vtt_url    = button.getAttribute('x-vtt-url')

  if (video_url)
    process_video_url(video_url, video_type, vtt_url)
}

var make_start_video_button = function(video_url, video_type, vtt_url) {
  var button = make_element('button')

  button.setAttribute('x-video-url',  video_url)
  button.setAttribute('x-video-type', video_type)
  button.setAttribute('x-vtt-url',    vtt_url)
  button.innerHTML = strings.button_start_video
  button.addEventListener("click", onclick_start_video_button)

  return button
}

var add_start_video_button = function(video_url, video_type, vtt_url, block_element, old_button) {
  var new_button = make_start_video_button(video_url, video_type, vtt_url)

  if (old_button)
    old_button.parentNode.replaceChild(new_button, old_button)
  else
    block_element.appendChild(new_button)
}

// -----------------------------------------------------------------------------

var make_episode_listitem_html = function(data) {
  if (data.duration)
    data.duration = get_ms_duration_time_string(data.duration)

  var tr = []

  var append_tr = function(td, colspan) {
    if (Array.isArray(td))
      tr.push('<tr><td>' + td.join('</td><td>') + '</td></tr>')
    else if ((typeof colspan === 'number') && (colspan > 1))
      tr.push('<tr><td colspan="' + colspan + '">' + td + '</td></tr>')
    else
      tr.push('<tr><td>' + td + '</td></tr>')
  }

  if (data.title && data.url)
    data.title = '<a target="_blank" href="' + data.url + '">' + data.title + '</a>'
  if (data.title)
    append_tr([strings.episode_labels.title, data.title])
  if (data.duration)
    append_tr([strings.episode_labels.time_duration, data.duration])
  if (data.description)
    append_tr(strings.episode_labels.summary, 2)

  var html = ['<table>' + tr.join("\n") + '</table>']
  if (data.description)
    html.push('<blockquote>' + data.description + '</blockquote>')

  return '<li x-video-id="' + data.video_id + '">' + html.join("\n") + '</li>'
}

var add_episode_div_buttons = function(episodes, episodes_div) {
  var episode, video_id, block_element, video_data

  for (var i=0; i < episodes.length; i++) {
    episode       = episodes[i]
    video_id      = episode.ID
    block_element = episodes_div.querySelector('li[x-video-id="' + video_id + '"]')
    video_data    = get_video_data(episode)

    if (!block_element || !video_data.video_url) continue

    insert_webcast_reloaded_div(block_element, video_data.video_url, video_data.vtt_url)
    add_start_video_button(video_data.video_url, video_data.video_type, video_data.vtt_url, block_element)
  }
}

var display_episodes = function(episodes, show_id, episodes_div) {
  var data = []
  var episode, video_id, url, title, duration, description, html

  for (var i=0; i < episodes.length; i++) {
    episode  = episodes[i]
    video_id = episode.ID
    title    = (episode.Season && episode.Episode)
      ? ('S' + pad_zeros(episode.Season, 2) + 'E' + pad_zeros(episode.Episode, 2) + ' - ' + episode.ShowName + ' - ' + episode.Title)
      : episode.Title
    duration = ('number' === (typeof episode.DurationInMS))
      ? episode.DurationInMS
      : 0
    description = episode.Description

    if (video_id && title)
      data.push({video_id: video_id, title: title, duration: duration, description: description})
  }

  html = '<ul>' + data.map(make_episode_listitem_html).join("\n") + '</ul>'
  episodes_div.innerHTML = html

  add_episode_div_buttons(episodes, episodes_div)
}

var download_episodes = function(show_id, episodes_div) {
  var callback = function(episodes) {
    display_episodes(episodes, show_id, episodes_div)
  }

  fetch_api_session_series_episodes(show_id, callback)
}

// ----------------------------------------------------------------------------- DOM: dynamic elements - EPG data - 1st pass (automatic, list all TV series and movies)

var active_channel_types      = {"shows": strings.types.shows, "movies": strings.types.movies}
var active_channel_categories = {}

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

var make_channel_div = function(type, data) {
  if (!data || (typeof data !== 'object') || !data.ID || !data.Title) return null

  var id, name, category, lc_category, summary, div, html

  id          = data.ID
  name        = data.Title
  category    = data.Genre                       || ''
  lc_category = category ? category.toLowerCase() : ''

  if (lc_category)
    active_channel_categories[lc_category] = category

  summary = []
  if (data.Description)
    summary.push(data.Description)
  if (data.DurationInMS)
    summary.push(strings.episode_labels.time_duration + ' ' + get_ms_duration_time_string(data.DurationInMS))
  if (summary.length)
    summary = '<p>' + summary.join('</p><p>') + '</p>'

  div = make_element('div')

  html = [
    '<div class="' + constants.dom_classes.div_heading + '">',
    '  <h2>' + name + '</h2>',
    '  <div class="' + constants.dom_classes.div_toggle + '"></div>',
    '</div>',
    '<div class="' + constants.dom_classes.div_collapsible + '">',
    '  <div>' + summary + '</div>',
    '  <div class="' + constants.dom_classes.div_episodes + '"></div>',
    '</div>'
  ]

  div.setAttribute('id',             (type + '_' + id))
  div.setAttribute('class',          constants.dom_classes.toggle_expanded)
  div.setAttribute('x-type-id',      type)
  div.setAttribute('x-category-id',  lc_category)
  div.setAttribute('x-channel-name', name.toLowerCase())
  div.innerHTML = html.join("\n")
  div.querySelector(':scope > div.' + constants.dom_classes.div_heading + ' > div.' + constants.dom_classes.div_toggle).addEventListener("click", onclick_channel_toggle)

  add_channel_div_buttons(type, data, div)

  return div
}

var process_epg_data = function(channel_type, data) {
  if (!data || !Array.isArray(data) || !data.length) return

  var EPG_data = unsafeWindow.document.getElementById(constants.dom_ids.div_data)
  var channel_data, div

  for (var i=0; i < data.length; i++) {
    channel_data = data[i]

    div = make_channel_div(channel_type, channel_data)
    if (div) {
      EPG_data.appendChild(div)
    }
  }
}

// -----------------------------------------------------------------------------

var onclick_download_episodes_button = function(event) {
  event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;

  var button  = event.target
  var type    = button.getAttribute('x-type-id')
  var show_id = button.getAttribute('x-show-id')
  if (!type || !show_id) return

  var episodes_div = unsafeWindow.document.querySelector('#' + type + '_' + show_id + ' div.' + constants.dom_classes.div_episodes)
  if (!episodes_div) return

  download_episodes(show_id, episodes_div)
}

var make_download_episodes_button = function(type, show_id) {
  var button = make_element('button')

  button.setAttribute('x-type-id', type)
  button.setAttribute('x-show-id', show_id)
  button.innerHTML = strings.button_download_episodes
  button.addEventListener("click", onclick_download_episodes_button)

  return button
}

var add_channel_div_buttons = function(type, data, div) {
  var episodes_div = div.querySelector('div.' + constants.dom_classes.div_episodes)

  episodes_div.innerHTML = ''

  if (type === 'shows') {
    var button = make_download_episodes_button(type, data.ID)

    episodes_div.appendChild(button)
  }
  else if (type === 'movies') {
    var video_data    = get_video_data(data)
    var block_element = episodes_div.parentNode

    if (video_data.video_url) {
      insert_webcast_reloaded_div(block_element, video_data.video_url, video_data.vtt_url)
      add_start_video_button(video_data.video_url, video_data.video_type, video_data.vtt_url, episodes_div)
    }
  }
}

// -----------------------------------------------------------------------------

var populate_type_select_filter = function() {
  var select = unsafeWindow.document.getElementById(constants.dom_ids.select_type)
  var option, keys, value, name

  select.innerHTML = ''

  option = make_element('option')
  option.setAttribute('selected', 'selected')
  option.setAttribute('value', '')
  option.innerHTML = strings.default_type
  select.appendChild(option)

  keys = Object.keys(active_channel_types)
  if (!keys || !Array.isArray(keys) || !keys.length) return

  for (var i=0; i < keys.length; i++) {
    value = keys[i]
    name  = active_channel_types[value]

    if (value && name) {
      option = make_element('option')
      option.setAttribute('value', value)
      option.innerHTML = name
      select.appendChild(option)
    }
  }
}

var populate_category_select_filter = function() {
  var select = unsafeWindow.document.getElementById(constants.dom_ids.select_category)
  var option, keys, value, name

  select.innerHTML = ''

  option = make_element('option')
  option.setAttribute('selected', 'selected')
  option.setAttribute('value', '')
  option.innerHTML = strings.default_category
  select.appendChild(option)

  keys = Object.keys(active_channel_categories)
  if (!keys || !Array.isArray(keys) || !keys.length) return

  for (var i=0; i < keys.length; i++) {
    value = keys[i]
    name  = active_channel_categories[value]

    if (value && name) {
      option = make_element('option')
      option.setAttribute('value', value)
      option.innerHTML = name
      select.appendChild(option)
    }
  }
}

var post_process_epg_data = function() {
  // called after 1st pass is complete

  var EPG_root = unsafeWindow.document.getElementById(constants.dom_ids.div_root)

  populate_type_select_filter()
  populate_category_select_filter()

  if (!EPG_root.classList.contains(constants.dom_classes.data_loaded))
    EPG_root.className = constants.dom_classes.data_loaded
}

// ----------------------------------------------------------------------------- EPG: data cache

var epg_data_cache = {
  data: null,
  initialize_data: function() {
    epg_data_cache.data = {shows: [], movies: []}
  },
  sort_data: function() {
    if (!epg_data_cache.data) return

    var compare_items = function(a,b) {
      return (a.Title < b.Title)
        ? -1
        : (a.Title > b.Title)
            ? 1
            : 0
    }

    epg_data_cache.data.shows.sort(compare_items)
    epg_data_cache.data.movies.sort(compare_items)
  },
  add_raw_data: function(type, entries) {
    var old_entry, new_entry

    for (var i=0; i < entries.length; i++) {
      old_entry = entries[i]
      new_entry = {}

      if (!old_entry || (typeof old_entry !== 'object') || !old_entry.ID || !old_entry.Title)
        continue

      new_entry.ID           = old_entry.ID
      new_entry.Title        = old_entry.Title
      new_entry.Genre        = old_entry.Genre
      new_entry.Description  = old_entry.Description
      new_entry.DurationInMS = old_entry.DurationInMS

      epg_data_cache.data[type].push(new_entry)
    }
  },
  is_persistent_storage_available: function() {
    return ((typeof GM_setValue === 'function') && (typeof GM_getValue === 'function'))
  },
  load_data_from_persistent_storage: function() {
    try {
      if (!epg_data_cache.is_persistent_storage_available()) throw ''

      var json = GM_getValue(constants.cache_keys.epg_data, '')
      if (!json) throw ''

      var data = JSON.parse(json)
      if (!data || (typeof data !== 'object') || !Array.isArray(data.shows) || !Array.isArray(data.movies) || !data.shows.length || !data.movies.length) throw ''

      epg_data_cache.data = data
      return true
    }
    catch(error) {
      return false
    }
  },
  save_data_to_persistent_storage: function() {
    try {
      if (!epg_data_cache.is_persistent_storage_available()) throw ''

      var json = JSON.stringify(epg_data_cache.data)
      GM_setValue(constants.cache_keys.epg_data, json)
      return true
    }
    catch(error) {
      return false
    }
  },
  get_item_count_in_persistent_storage: function() {
    try {
      if (!epg_data_cache.is_persistent_storage_available()) throw ''

      var count = GM_getValue(constants.cache_keys.epg_data_count, '')
      if (!count) return 0

      count = parseInt(count, 10)
      if (!count || isNaN(count)) return 0

      return count
    }
    catch(error) {
      return -1
    }
  },
  save_item_count_to_persistent_storage: function() {
    try {
      if (!epg_data_cache.is_persistent_storage_available()) throw ''

      var count = epg_data_cache.data.shows.length + epg_data_cache.data.movies.length
      GM_setValue(constants.cache_keys.epg_data_count, ('' + count))

      // fire an event that can be used to dynamically update the DOM
      unsafeWindow.postMessage({new_item_count_in_persistent_storage: count}, '*')

      return true
    }
    catch(error) {
      return false
    }
  },
  clear_persistent_storage: function() {
    try {
      if (!epg_data_cache.is_persistent_storage_available()) throw ''

      epg_data_cache.initialize_data()
      epg_data_cache.save_data_to_persistent_storage()
      epg_data_cache.save_item_count_to_persistent_storage()
      return true
    }
    catch(error) {
      return false
    }
  }
}

// ----------------------------------------------------------------------------- EPG: download data, store to persistent cache

var populate_epg_data_cache = function(oncomplete) {
  epg_data_cache.initialize_data()

  fetch_api_session_token(function(){
    fetch_api_session_categories(function(category_ids){
      var categories_remaining = category_ids.length

      var item_ids = {}

      var item_id_is_distinct = function(item) {
        if (!item.ID)
          return false
        if (item_ids[item.ID])
          return false

        item_ids[item.ID] = true
        return true
      }

      var dedupe_items = function(items) {
        if (items.shows.length)
          items.shows = items.shows.filter(item_id_is_distinct)
        if (items.movies.length)
          items.movies = items.movies.filter(item_id_is_distinct)
      }

      for (var i=0; i < category_ids.length; i++) {
        fetch_api_session_category_items(category_ids[i], function(items){
          dedupe_items(items)

          if (items.shows.length)
            epg_data_cache.add_raw_data('shows', items.shows)
          if (items.movies.length)
            epg_data_cache.add_raw_data('movies', items.movies)

          categories_remaining--

          if (categories_remaining <= 0)
            oncomplete()
        })
      }
    })
  })
}

// ----------------------------------------------------------------------------- EPG: build DOM from data

var populate_epg_data = function() {
  var process_epg_data_cache = function() {
    var data  = epg_data_cache.data
    var types, type, entries

    types = Object.keys(data)
    for (var i=0; i < types.length; i++) {
      type    = types[i]
      entries = data[type]

      process_epg_data(type, entries)
    }

    post_process_epg_data()
  }

  if (epg_data_cache.load_data_from_persistent_storage()) {
    process_epg_data_cache()
  }
  else {
    var oncomplete = function() {
      epg_data_cache.sort_data()
      epg_data_cache.save_data_to_persistent_storage()
      epg_data_cache.save_item_count_to_persistent_storage()
      process_epg_data_cache()
    }

    populate_epg_data_cache(oncomplete)
  }
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
    populate_dom_filters()
    populate_dom_tools()
    populate_epg_data()
  }
  else if (pathname.indexOf(constants.base_url.pathname) >= 0) {
    redirect_to_url(constants.target_url.pathname + constants.target_url.hash)
  }
}

init()

// -----------------------------------------------------------------------------
