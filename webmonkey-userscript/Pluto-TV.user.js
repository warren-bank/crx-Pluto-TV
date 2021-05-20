// ==UserScript==
// @name         Pluto TV: live-tv
// @description  Watch videos in external player.
// @version      2.0.0
// @match        *://pluto.tv/*
// @match        *://*.pluto.tv/*
// @icon         https://pluto.tv/assets/images/favicons/favicon.png
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-Pluto-TV/tree/live-tv/webmonkey-userscript/es6
// @supportURL   https://github.com/warren-bank/crx-Pluto-TV/issues
// @downloadURL  https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js
// @updateURL    https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

const user_options = {
  "script_init_poll_interval_ms": 500,
  "script_init_timeout_ms":       30000,
  "redirect_to_webcast_reloaded": true,
  "force_http":                   true,
  "force_https":                  false
}

const constants = {
  "base_url": {
    "pathname":                   "/live-tv"
  }
}

// ----------------------------------------------------------------------------- DOM updates

const pre_update_dom = function() {
  const CSS = `
    video,
    body > *,
    body > #root > *,
    body > #root > div.withGuide > div[kind="linearChannel"]
    {display: none !important;}

    body > #root,
    body > #root > div.withGuide
    {display: block !important;}

    body > #root > div.withGuide,
    body > #root > div.withGuide > div[kind="linearChannel"] + div
    {height: 100% !important;}
  `

  const style     = unsafeWindow.document.createElement('style')
  style.type      = 'text/css'
  style.innerHTML = CSS
  unsafeWindow.document.getElementsByTagName('head')[0].appendChild(style)

  unsafeWindow.onkeydown = function(event){
    event.stopPropagation();event.stopImmediatePropagation();event.preventDefault();event.returnValue=true;
  }
  unsafeWindow.onclick = function(){
    const scrolldiv = unsafeWindow.document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List')
    if (scrolldiv) scrolldiv.focus()
  }
}

const update_dom = function() {
  unsafeWindow.onclick()
}

// ----------------------------------------------------------------------------- URL for HLS video stream

const is_channel = function() {
  const pathname = unsafeWindow.location.pathname
  let index

  index = pathname.indexOf(constants.base_url.pathname + '/')
  if (index === -1) return false

  index += constants.base_url.pathname.length + 1
  if (index === pathname.length) return false

  return true
}

const get_id = function() {
  if (!is_channel()) return null

  const img = unsafeWindow.document.querySelector('div.сhannel-line-container-selected img[src^="https://images.pluto.tv/channels/"]')
  if (!img) return null

  const regex = new RegExp('^.*/channels/([^/]+)/.*$')
  const src = img.getAttribute('src')
  if (!regex.test(src)) return null

  const id = src.replace(regex, '$1')
  return id
}

const generate_uuidv4 = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const get_hls_url = function() {
  const id = get_id()
  if (!id) return null

  let appVersion
  try {
    appVersion = document.querySelector('meta[name="appVersion"][content]').getAttribute('content')
  }
  catch(e){
    appVersion = '0'
  }

  const uuids = {
    "device":  generate_uuidv4(),
    "session": generate_uuidv4()
  }

  const hls_url_qs = [
    'advertisingId=',
    'appName=web',
    `appVersion=${appVersion}`,
    'app_name=web',
    'clientDeviceType=0',
    `clientID=${uuids.device}`,
    'clientModelNumber=',
    'deviceDNT=false',
    `deviceId=${uuids.device}`,
    'deviceLat=38.8979',
    'deviceLon=-77.0365',
    'deviceMake=Chrome',
    'deviceModel=web',
    'deviceType=web',
    'deviceVersion=90.0.4710.39',
    'marketingRegion=US',
    'serverSideAds=false',
    `sessionID=${uuids.session}`,
    `sid=${uuids.session}`,
    'userId='
  ]

  const hls_url = 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/' + id + '/master.m3u8?' + hls_url_qs.join('&')
  return hls_url
}

// ----------------------------------------------------------------------------- URL for Webcast Reloaded website

const get_webcast_reloaded_url = (hls_url, vtt_url, referer_url) => {
  let encoded_hls_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_hls_url       = encodeURIComponent(encodeURIComponent(btoa(hls_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (user_options.force_http)
                            ? webcast_reloaded_base.http
                            : (user_options.force_https)
                               ? webcast_reloaded_base.https
                               : (hls_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_hls_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

const redirect_to_url = function(url) {
  if (!url) return

  try {
    unsafeWindow.top.location = url
  }
  catch(e) {
    unsafeWindow.location = url
  }
}

const process_hls_url = function(hls_url) {
  const referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser
    GM_startIntent(/* action= */ 'android.intent.action.VIEW', /* data= */ hls_url, /* type= */ 'application/x-mpegurl', /* extras: */ 'referUrl', referer_url)
  }
  else if (user_options.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website
    redirect_to_url(get_webcast_reloaded_url(hls_url, /* vtt_url= */ null, referer_url))
  }
}

// ----------------------------------------------------------------------------- bootstrap

const init = function(hls_url) {
  if (hls_url) {
    process_hls_url(hls_url)
  }

  unsafeWindow.history.pushState    = function(a,b,c) {unsafeWindow.location = c}
  unsafeWindow.history.replaceState = unsafeWindow.history.pushState

  update_dom()
}

const max_poll_attempts = Math.ceil(user_options.script_init_timeout_ms / user_options.script_init_poll_interval_ms)
let count_poll_attempts = 0

const call_init_when_dom_ready = function() {
  count_poll_attempts++
  if (count_poll_attempts > max_poll_attempts) {
    init()
  }
  else {
    const hls_url = get_hls_url()
    if (hls_url) {
      init(hls_url)
    }
    else {
      setTimeout(call_init_when_dom_ready, user_options.script_init_poll_interval_ms)
    }
  }
}

const pre_init = function() {
  if (unsafeWindow.location.pathname.indexOf(constants.base_url.pathname) === -1) return

  const call_init_on_next_history_state_change = !is_channel()

  unsafeWindow.history.pushState    = function(){if (call_init_on_next_history_state_change) init()}
  unsafeWindow.history.replaceState = unsafeWindow.history.pushState

  pre_update_dom()

  if (call_init_on_next_history_state_change) {
    setTimeout(init, user_options.script_init_timeout_ms)
  }
  else {
    call_init_when_dom_ready()
  }
}

pre_init()

// -----------------------------------------------------------------------------
