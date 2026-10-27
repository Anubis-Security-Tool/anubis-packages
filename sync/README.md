# electerm-sync API js wrapper

[English](README.md) | [简体中文](README.cn.md)

## Installation

### Node.js

```bash
npm i electerm-sync
```

## Usage

```js
import { electermSync } from 'electerm-sync'
import axios from 'axios'

// type: 'github', 'gitee', 'custom', 'cloud'
// func: 'test', 'create', 'update', 'getOne'
// args: array of arguments for the function
// token: access token or connection string
const result = await electermSync(
  axios.create(),
  'github',
  'test',
  [],
  'your-github-token'
)
```

## Test

```bash
npm run test
```

## License

MIT
