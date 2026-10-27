[中文](./README_cn.md)

<h1 class="aligncenter">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="electerm" />
    </a>
</h1>

# electerm-themes

Theme pack for [electerm](https://github.com/electerm/electerm), vendored from [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes), plus electerm custom themes. Themes are stored locally in `./themes` so builds stay stable without fetching from upstream.

## Usage

```
npm install @electerm/electerm-themes
```

```js
const themes = require('@electerm/electerm-themes')
// or
import themes from '@electerm/electerm-themes/dist/index.mjs'

// themes is an array of theme file contents (string),
// each theme is a `key=value` list, eg:
// themeName=3024 Day
// main=#ededed
// ...
```

You can also copy single theme files from `dist/themes/*.txt` and load them in electerm directly, or preview/edit them at [theme.electerm.org](https://theme.electerm.org).

## Development

Add or edit theme files in `./themes` (`*.txt`, `key=value` per line, must include `themeName`), then:

```
npm run build
npm test
```

The build reads every file in `./themes` into `dist/index.js`, `dist/index.mjs` and copies the txt files to `dist/themes`.

## About electerm

electerm is an open-source terminal / SSH / SFTP / FTP / Telnet / serialport / RDP / VNC / Spice client, supporting Linux, macOS, Windows, Android, HarmonyOS, and iOS.

Besides the mainstream Windows / macOS / Linux / Android platforms, electerm also supports HarmonyOS, iOS, and older systems such as Ubuntu 18, Windows 7, macOS 10+, as well as domestic Linux distributions like UOS, Kylin, and LoongArch (both old-world and new-world).

## Related projects/sites

- [electerm](https://github.com/electerm/electerm): The main desktop app (Electron-based)
- [electerm.org](https://electerm.org): Homepage, downloads, videos, etc
- [electerm-web](https://github.com/electerm/electerm-web): Web app version running in browser (including mobile device)
- [electerm-web-docker](https://github.com/electerm/electerm-web-docker): Docker image for electerm-web
- [electerm-android](https://github.com/electerm/electerm-android): Android app
- [electerm-harmony](https://github.com/electerm/electerm-harmony): HarmonyOS app
- [electerm-ios](https://github.com/electerm/electerm-ios): iOS app
- [electerm online](https://cloud.electerm.org): Public free online electerm app
- [electerm AI](https://ai.electerm.org): Free AI for electerm users
- [theme.electerm.org](https://theme.electerm.org): Theme live editor, live preview & sharing
- [electerm demo](https://demo.electerm.org): Online demo of electerm
- [electerm deb repo](https://repos.electerm.org/deb): Debian repo of electerm
- [electerm rpm repo](https://repos.electerm.org/rpm): RPM repo of electerm
- [electerm-locales](https://github.com/electerm/electerm-locales): Language/i18n files for electerm
- [Apple App Store](https://apps.apple.com/cn/app/electerm/id6792971552)
- [Huawei AppGallery](https://appgallery.huawei.com/app/detail?id=org.electerm.electerm)
- [Microsoft Store](https://www.microsoft.com/store/apps/9NCN7272GTFF)
- [Snap Store](https://snapcraft.io/electerm)

## License

MIT
