### [Pluto TV: live-tv](https://github.com/warren-bank/crx-Pluto-TV/tree/live-tv/webmonkey-userscript/es5)

[Userscript](https://github.com/warren-bank/crx-Pluto-TV/raw/live-tv/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js) to run in both:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android
* the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) web browser extension for Chrome/Chromium

Its purpose is to:
* provide a simplified interface to access live-tv video content hosted by [Pluto TV](https://pluto.tv/live-tv) that works in all web browsers
  - special attention is given to Android 4.x WebView, which is based on Chrome v30, to ensure support for older Android devices
* enable watching video streams in an external player

#### Notes:

* all [live-tv pages](https://pluto.tv/live-tv) on the website are redirected to a single [target page](https://pluto.tv/careers#live-tv)
  - chosen because its original content contains a minimal amount of script and style
* after the target page has been loaded
  - its original content is replaced by a new single-page app (SPA) that only requires ES5

#### Video Content Protections:

* to access the data API endoint and video stream hosts:
  - geographic location of client IP address determines availability of content
  - login is _not_ required
  - _Referer_ request header _is_ required

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
