### [Pluto TV](https://github.com/warren-bank/crx-Pluto-TV/tree/webmonkey-userscript/es6)

[Userscript](https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js) to run in both:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android
* the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) web browser extension for Chrome/Chromium

Its purpose is to:
* remove clutter from the [Pluto TV channel guide](https://pluto.tv/live-tv/)
* enable watching video streams in an external player

#### Notes:

* the official [Pluto TV channel guide](https://pluto.tv/live-tv/) website requires a browser capable of running modern Javascript (ES6)
  - this [ES6 userscript](https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es6/webmonkey-userscript/Pluto-TV.user.js) works in cooperation with the DOM that is dynamically built by this page
  - the [ES5 userscript](https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js) works entirely independent from the official [Pluto TV channel guide](https://pluto.tv/live-tv/)
    * it redirects to a page on the same domain that has a minimal amount of Javascript
    * once on this page, it completely rewrites the DOM and produces a new single-page-app that has a simple design and will function properly in very old web browsers
* a browser capable of running modern Javascript (ES6) can use either userscript version
  - the [ES5 userscript](https://github.com/warren-bank/crx-Pluto-TV/raw/webmonkey-userscript/es5/webmonkey-userscript/Pluto-TV.user.js) will drain much less battery, and produces an interface that is (arguably) more functional.. especially on small-screen devices
* the video player used to watch the Pluto TV video streams will need to send _Referer_ HTTP request headers from the _pluto.tv_ domain
  - the value of this header is included in an Intent extra
  - [ExoAirPlayer](https://github.com/warren-bank/Android-ExoPlayer-AirPlay-Receiver) reads this Intent extra, and can properly play all video streams

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
