[English](./README.md)

<h1 class="aligncenter">
    <a href="https://electerm.org">
        <img src="https://github.com/electerm/electerm-resource/raw/master/static/images/electerm.png", alt="electerm" />
    </a>
</h1>

# electerm-themes

[electerm](https://github.com/electerm/electerm) 的主题包，vendored 自 [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes)，并包含 electerm 自定义主题。所有主题都存放在本地 `./themes` 目录，不再从上游拉取，以保证构建稳定。

## 使用

```
npm install @electerm/electerm-themes
```

```js
const themes = require('@electerm/electerm-themes')
// 或
import themes from '@electerm/electerm-themes/dist/index.mjs'

// themes 为主题文件内容字符串数组，
// 每个主题为 `key=value` 列表，例如：
// themeName=3024 Day
// main=#ededed
// ...
```

也可以直接从 `dist/themes/*.txt` 复制单个主题文件到 electerm 中使用，或在 [theme.electerm.org](https://theme.electerm.org) 在线预览/编辑。

## 开发

在 `./themes` 下新增或修改主题文件（`*.txt`，每行 `key=value`，必须包含 `themeName`），然后执行：

```
npm run build
npm test
```

构建会读取 `./themes` 下的所有文件，生成 `dist/index.js`、`dist/index.mjs`，并把 txt 文件复制到 `dist/themes`。

## 关于 electerm

electerm 是一款开源的终端 / SSH / SFTP / FTP / Telnet / 串口 / RDP / VNC / Spice 客户端，支持 Linux、macOS、Windows、Android、HarmonyOS 与 iOS 等平台。

除主流的 Windows / macOS / Linux / Android 外，electerm 还支持 HarmonyOS、iOS，以及较老的系统，如 Ubuntu 18、Windows 7、macOS 10+，以及 UOS、麒麟、龙架构（LoongArch，新旧世界）等国产 Linux 发行版。

## 相关项目/站点

- [electerm](https://github.com/electerm/electerm)：主桌面应用（基于 Electron）
- [electerm.org](https://electerm.org)：主页、下载、视频等
- [electerm-web](https://github.com/electerm/electerm-web)：运行于浏览器（支持移动设备）的 web app 版本
- [electerm-web-docker](https://github.com/electerm/electerm-web-docker)：electerm-web 的 docker 镜像
- [electerm-android](https://github.com/electerm/electerm-android)：安卓端应用
- [electerm-harmony](https://github.com/electerm/electerm-harmony)：鸿蒙端应用
- [electerm-ios](https://github.com/electerm/electerm-ios)：iOS 端应用
- [electerm online](https://cloud.electerm.org)：公共免费在线 electerm 应用
- [electerm AI](https://ai.electerm.org)：面向 electerm 用户的免费 AI
- [theme.electerm.org](https://theme.electerm.org)：主题在线编辑、实时预览与分享
- [electerm demo](https://demo.electerm.org)：在线演示
- [electerm deb repo](https://repos.electerm.org/deb)：Debian 软件源
- [electerm rpm repo](https://repos.electerm.org/rpm)：RPM 软件源
- [electerm-locales](https://github.com/electerm/electerm-locales)：多语言/国际化文件
- [Apple App Store](https://apps.apple.com/cn/app/electerm/id6792971552)
- [华为应用市场](https://appgallery.huawei.com/app/detail?id=org.electerm.electerm)
- [Microsoft Store](https://www.microsoft.com/store/apps/9NCN7272GTFF)
- [Snap Store](https://snapcraft.io/electerm)

## 许可证

MIT
