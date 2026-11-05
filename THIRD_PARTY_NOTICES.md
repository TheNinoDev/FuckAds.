# Third-party notices

The Work.ink session-controller approach is adapted from [IHaxU/work.ink-bypass](https://github.com/IHaxU/work.ink-bypass).

MIT License

Copyright (c) 2025 IHaxU

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Ad blocking domains

The bundled adblock-rules.json converts and combines domain entries from [Steven Black’s hosts list](https://github.com/StevenBlack/hosts) and the [AdAway default blocklist](https://github.com/AdAway/adaway.github.io/blob/master/hosts.txt), retrieved 2026-11-04. Entries were deduplicated and converted to browser network rules; Work.ink and bypass.city were excluded.

AdAway default blocklist: Kicelo, Dominik Schuermann and the contributors in its [commit history](https://github.com/AdAway/adaway.github.io/commits/master/hosts.txt), licensed under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/). Changes: conversion, filtering and combination with the Steven Black list.

Steven Black license:

The MIT License (MIT)

Copyright © 2026 Steven Black

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## EasyList filters

The [EasyList authors](https://easylist.to/) provide [EasyList](https://easylist.to/easylist/easylist.txt) and the [Adblock Warning Removal List](https://github.com/easylist/antiadblockfilters), downloaded 2026-11-04. Selected domain, script and site-specific cosmetic filters were translated to browser rules, with unsupported forms omitted. These adapted filters are shared under [Creative Commons Attribution-ShareAlike 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/); see the [EasyList license](https://easylist.to/pages/licence.html).

## Compiled network filters

The bundled `adblock-rules.json` includes block and allow rules adapted from uBlock Origin Lite’s [EasyList](https://github.com/uBlockOrigin/uBOL-home/blob/e03161e379f8316b28a42df33c397d50716b2ab7/chromium/rulesets/main/easylist.json), [German](https://github.com/uBlockOrigin/uBOL-home/blob/e03161e379f8316b28a42df33c397d50716b2ab7/chromium/rulesets/main/deu-0.json), and [uBlock filters](https://github.com/uBlockOrigin/uBOL-home/blob/e03161e379f8316b28a42df33c397d50716b2ab7/chromium/rulesets/main/ublock-filters.json) rulesets, retrieved 2026-11-04. Rules were renumbered and merged with the existing rules; redirects, header modification and response-header conditions were omitted. The original filters include [EasyList and EasyList Germany](https://easylist.to/pages/licence.html) and [uBlock Origin filter lists](https://github.com/uBlockOrigin/uAssets). The uBlock filter lists are GPL-3.0; their license text is included in `licenses/GPL-3.0.txt`, and upstream source is available at the linked uAssets repository. EasyList filters are attributed to the EasyList authors and licensed as described above.

## EasyPrivacy network filters

The bundled `adblock-rules.json` includes block and allow rules adapted from [uBlock Origin Lite’s compiled EasyPrivacy ruleset](https://github.com/uBlockOrigin/uBOL-home/blob/e03161e379f8316b28a42df33c397d50716b2ab7/chromium/rulesets/main/easyprivacy.json), retrieved 2026-11-04. Rules were renumbered; redirects and header modifications were omitted. EasyPrivacy is maintained by [the EasyList authors](https://easylist.to/) and the adapted filter data is shared under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); see the [upstream license](https://easylist.to/pages/licence.html).

## Additional tracker hosts

Selected TikTok, Yahoo and Yandex tracking and advertising hostnames were checked against [HaGeZi’s Multi PRO list](https://github.com/hagezi/dns-blocklists/blob/main/adblock/pro.txt), retrieved 2026-11-04. The extension uses third-party request rules for these hosts. HaGeZi’s list is licensed under [GPL-3.0](https://github.com/hagezi/dns-blocklists/blob/main/LICENSE); a copy is included in `licenses/GPL-3.0.txt`.

## HaGeZi domain filters

Additional domains were adapted from [HaGeZi Multi Normal](https://github.com/hagezi/dns-blocklists/blob/eb7db8ed27237af2f3c0cb79c9c735e3e076dbad/adblock/multi.txt) and [HaGeZi TikTok Tracker](https://github.com/hagezi/dns-blocklists/blob/eb7db8ed27237af2f3c0cb79c9c735e3e076dbad/adblock/native.tiktok.txt), retrieved 2026-11-04. They were deduplicated and converted to third-party browser network rules, including navigation requests; bypass providers were excluded. These filter data are licensed under GPL-3.0. The license text is included in `licenses/GPL-3.0.txt`, with the precise upstream source linked above.

## HaGeZi Pop-Up Ads

Additional third-party ad and redirect domains are adapted from [HaGeZi Pop-Up Ads](https://github.com/hagezi/dns-blocklists/blob/eb7db8ed27237af2f3c0cb79c9c735e3e076dbad/adblock/popupads.txt), retrieved 2026-11-04. Entries were deduplicated and translated to network rules. GPL-3.0 applies; the license is included in `licenses/GPL-3.0.txt`.

## Additional generic and network filters

`adblock-generic.js` contains a selected subset of simple generic cosmetic selectors from [EasyList](https://easylist.to/), retrieved 2026-11-04, credited to the EasyList authors and adapted under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Selectors with listed exceptions were excluded. Additional domains are adapted from [HaGeZi Multi Pro](https://github.com/hagezi/dns-blocklists/blob/eb7db8ed27237af2f3c0cb79c9c735e3e076dbad/adblock/pro.txt), distributed under GPL-3.0; see `licenses/GPL-3.0.txt`. Rules were deduplicated, limited to third-party requests and bypass providers were excluded.
