# Continium Browser JS Library

[![npm package](https://img.shields.io/npm/v/@continium/js?style=flat-square)](https://www.npmjs.com/package/@continium/js)
[![MIT License](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Please see [Continium Docs](https://continium.com/docs).
Specifically, [Quickstart/Implementation details](https://continium.com/docs/getting-started/quickstart-in-app-survey).

## What is Continium

Continium is your go-to solution for in-product micro-surveys that will supercharge your product experience! 🚀 For more information please check out [continium.com](https://continium.com).

## How to use this library

1. Install the Continium package inside your project using npm:

```bash
npm install -s @continium/js
```

2. Import Continium and initialize the widget in your main component (e.g., App.tsx or App.js):

```javascript
import continium from "@continium/js";

if (typeof window !== "undefined") {
  continium.setup({
    environmentId: "your-environment-id",
    appUrl: "https://app.continium.com",
  });
}
```

Replace your-environment-id with your actual environment ID. You can find your environment ID in the **Setup Checklist** in the Continium settings.

For more detailed guides for different frameworks, check out our [Framework Guides](https://continium.com/docs/getting-started/framework-guides).
