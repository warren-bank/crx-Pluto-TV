// ==UserScript==
// @name         Pluto TV
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://pluto.tv/live-tv
// @match        *://pluto.tv/live-tv/*
// @match        *://*.pluto.tv/live-tv
// @match        *://*.pluto.tv/live-tv/*
// @icon         https://pluto.tv/assets/images/favicons/favicon.png
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-Pluto-TV/tree/webmonkey-userscript/es6
// @supportURL   https://github.com/warren-bank/crx-Pluto-TV/issues
// @downloadURL  https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js
// @updateURL    https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

const user_options = {
  "script_init_poll_interval_ms": 500,
  "script_init_timeout_ms": 30000
}

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

const is_channel = function() {
  const pathname = unsafeWindow.location.pathname
  const pathroot = '/live-tv/'
  if (pathname.indexOf(pathroot) !== 0) return false
  if (pathname.length === pathroot.length) return false
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

const process_hls_url = function(hls_url) {
  const extras = ['referUrl', unsafeWindow.location.href]

  GM_startIntent(/* action= */ 'android.intent.action.VIEW', /* data= */ hls_url, /* type= */ 'application/x-mpegurl', /* extras: */ ...extras)
}

// -----------------------------------------------------------------------------

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
