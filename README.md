# FuckAds

A Chrome / Brave extension for supported ad-link destinations.

## Install or update

Download `FuckAds.zip` from [GitHub Releases](https://github.com/TheNinoDev/FuckAds./releases), extract it to a permanent folder, and open `brave://extensions` or `chrome://extensions`. Enable Developer mode and select that folder with **Load unpacked**.

To update, click **Update** in the popup to download the latest release ZIP. Extract its contents over the existing extension folder, then click **Reload** on the browser's extensions page. The browser may ask you to approve new permissions after an update.

## Publishing (maintainer)

Install Git and the GitHub CLI and sign in with `gh auth login`. Run `push.bat` to commit and push changes to `main`, then run `release.bat` to publish a release with `FuckAds.zip`. Before each later release, increase the version in `manifest.json`, push the change, and run `release.bat` again. The publishing scripts are kept in the source checkout and are not included in the release ZIP.

## How it works

Click the extension on a supported link and choose **Bypass this link**. FuckAds replaces that tab with its progress page and starts a separate inactive helper tab. If a valid destination is returned, the original tab changes to it even if it is not focused. Closing the progress tab ends the attempt. Back returns to the original page.

Bypass.city receives the complete link, including query parameters, for supported sites. Its website may require CAPTCHA verification; the extension cannot currently solve that challenge automatically.

Work.ink uses the experimental local adapter in a background tab, based on the older WebSocket approach and [IHaxU/work.ink-bypass](https://github.com/IHaxU/work.ink-bypass). It still needs genuine verification and has not been verified to bypass the sample links. Bypass.tools is not integrated, and its reported delivery failure has not been diagnosed. See `THIRD_PARTY_NOTICES.md` for attribution.

The extension removes its old Red-Square navigation rules on update. It no longer offers Red-Square bypass.

Run `node --test tests/*.test.cjs` for local regression tests. These do not establish live bypass success.

## Ad blocker

Use the **Ad blocker** switch in the extension popup to enable or disable network blocking. It is off by default. The bundled list combines Steven Black, AdAway, EasyList and Adblock Warning Removal List domains; see `THIRD_PARTY_NOTICES.md` for sources and licenses. Rules are packaged with the extension and updated when the extension is updated, not fetched automatically. The bundled lists also include HaGeZi Multi Pro, Pop-Up Ads and TikTok tracker domains, limited to third-party requests. Navigation to known ad domains can be blocked, including some links opened directly. With the blocker enabled, known Opera GX pages and GX domains are blocked. The rules also include compiled EasyList, EasyPrivacy, EasyList Germany, and uBlock Origin network rules, plus generic and site-specific cosmetic and ad-block warning filters. The broader Pro filters can occasionally block content a site needs; use the switch to turn blocking off if a page breaks. Some redirects, complex cosmetic filters, scriptlets and anti-adblock checks are not supported, so some ads and detections can remain. The cosmetic filters need site access on all HTTP and HTTPS pages. Sites may need to be reloaded after changing the switch.

### YouTube

When the ad blocker is enabled, selected YouTube ad placements are hidden and YouTube’s skip button is pressed when it appears in an active ad. Non-skippable video ads and anti-adblock challenges are not guaranteed to be bypassed. Reload YouTube after changing the switch.

FuckAds exempts ordinary Work.ink page requests from its own ad-blocking rules (with explicit Opera GX download exceptions) to reduce false ad-block detection; other blockers and Brave Shields can still interfere. This does not guarantee that Work.ink’s bypass or verification will work.

Known Google advertising frames and containers are hidden across sites, including Work.ink, when blocking is on. On Work.ink this is cosmetic: ad requests are still allowed by the Work.ink compatibility exception, and access prompts or verification challenges may remain.

The **Browser identity** dropdown sets a user-agent for HTTP(S) requests and `navigator.userAgent` on websites. Select **Browser default** to restore the actual identity. Reload open pages after changing it. Brave, Chrome and Chromium can have indistinguishable user agents, as can Opera and Opera GX. It also adjusts basic Client Hints where supported, but does not change the browser engine or every identifying signal and may not satisfy browser checks.

Newly opened tabs are closed when their first navigation is blocked by a browser-side filter. Already-open pages and FuckAds helper tabs are preserved. A block may come from another extension too. Spoofing changes only some identity signals, so bot checks can still appear; select Browser default and reload if a site rejects the spoof.

