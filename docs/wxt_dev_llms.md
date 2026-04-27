### Background Entrypoint Example (Directory)

Source: https://wxt.dev/guide/essentials/entrypoints

An example of a directory-based entrypoint for a background script.

```html
📂 entrypoints/
   📂 background/
      📄 index.ts
```

--------------------------------

### Background Entrypoint Example (Single File)

Source: https://wxt.dev/guide/essentials/entrypoints

An example of a single file entrypoint for a background script.

```html
📂 entrypoints/
   📄 background.ts
```

--------------------------------

### Install @wxt-dev/i18n with pnpm

Source: https://wxt.dev/i18n.html

Install the `@wxt-dev/i18n` package using pnpm. This is the first step for both WXT and non-WXT setups.

```sh
pnpm i @wxt-dev/i18n
```

--------------------------------

### MV3 Manifest Example

Source: https://wxt.dev/guide/essentials/config/manifest

Example of how WXT generates the manifest.json for MV3.

```json
{
  "manifest_version": 3,
  // ...
  "action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": [
    {
      "matches": ["*://*.google.com/*"],
      "resources": ["icon/*.png"]
    }
  ]
}
```

--------------------------------

### Run development mode

Source: https://wxt.dev/guide/installation.html

Start the development server to run the extension.

```sh
pnpm dev
```

```sh
bun run dev
```

```sh
npm run dev
```

```sh
yarn dev
```

--------------------------------

### MV2 Manifest Example

Source: https://wxt.dev/guide/essentials/config/manifest

Example of how WXT generates the manifest.json for MV2, including automatic conversions.

```json
{
  "manifest_version": 2,
  // ...
  "browser_action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": ["icon/*.png"]
}
```

--------------------------------

### Install and Configure `webextension-polyfill`

Source: https://wxt.dev/guide/resources/upgrading

If you choose to continue using the polyfill, install `webextension-polyfill` and the new WXT polyfill module, then add the module to your WXT configuration.

```sh
pnpm i webextension-polyfill @wxt-dev/webextension-polyfill
```

```ts
export default defineConfig({
  modules: ['@wxt-dev/webextension-polyfill'],
});
```

--------------------------------

### Example outBaseDir Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/resolvedconfig

Specifies the absolute path to the `.output` directory. This is where all build artifacts are initially placed.

```typescript
'/path/to/project/.output';
```

--------------------------------

### defineWebExtConfig()

Source: https://wxt.dev/api/reference/wxt/functions/definewebextconfig

Configures how web-ext starts the browser during development.

```APIDOC
## Function: defineWebExtConfig()

### Description
Configure how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser during development.

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
None

#### Response Example
None

## Function Signature
`defineWebExtConfig(config: WebExtConfig): WebExtConfig`

## Parameters
- **config** (WebExtConfig) - Required - Configuration object for web-ext browser startup.
```

--------------------------------

### Example outDir Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/resolvedconfig

Specifies the absolute path to the target output directory for a specific browser build. For example, this could be the Chrome MV3 output directory.

```typescript
'/path/to/project/.output/chrome-mv3';
```

--------------------------------

### server:started Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/wxthooks

This hook is called when the development server has started.

```APIDOC
## server:started Hook

### Description
Called when the dev server is started.

### Parameters

- **wxt** (Wxt) - The configured WXT object
- **server** (WxtDevServer) - Same as `wxt.server`, the object WXT uses to control the dev server.
```

--------------------------------

### outDirTemplate Example

Source: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig

Example of a template string for customizing the output directory structure. Available variables include {{browser}}, {{manifestVersion}}, {{mode}}, {{modeSuffix}}, and {{command}}.

```typescript
{{browser}} -mv{{manifestVersion}}
```

--------------------------------

### Install WXT Auto Icons

Source: https://wxt.dev/auto-icons.html

Install the package as a development dependency using your preferred package manager.

```sh
npm i --save-dev @wxt-dev/auto-icons
```

```sh
pnpm i -D @wxt-dev/auto-icons
```

```sh
yarn add --dev @wxt-dev/auto-icons
```

```sh
bun add -D @wxt-dev/auto-icons
```

--------------------------------

### Example Download Packages Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig

Specifies private packages to download and include in source zips for Firefox reviews. Do not include versions.

```typescript
// Correct:
  ['@scope/package-name', 'package-name'][
    // Incorrect, don't include versions!!!
    ('@scope/package-name@1.1.3', 'package-name@^2')
  ];
```

--------------------------------

### Create JSON Messages File for Non-WXT Setup

Source: https://wxt.dev/i18n.html

For setups without WXT, create localization files in the `_locales/<lang>/messages.json` format. This is the standard web extension format.

```json
{
  "helloWorld": {
    "message": "Hello world!"
  }
}
```

--------------------------------

### Install @wxt-dev/is-background

Source: https://wxt.dev/is-background.html

Install the package using pnpm. This command adds the @wxt-dev/is-background module to your project dependencies.

```sh
pnpm add @wxt-dev/is-background
```

--------------------------------

### Install WXT Analytics package

Source: https://wxt.dev/analytics.html

Install the required NPM package for analytics functionality.

```bash
pnpm i @wxt-dev/analytics
```

--------------------------------

### Default Folder Structure Example

Source: https://wxt.dev/guide/resources/upgrading

Illustrates the default WXT folder structure where 'modules/' and 'public/' are at the project root. This structure requires no configuration changes.

```html
📂 {rootDir}/
   📁 modules/ 
   📁 public/ 
   📂 src/
      📁 components/
      📁 entrypoints/
      📁 modules/ 
      📁 public/ 
      📁 utils/
      📄 app.config.ts
   📄 wxt.config.ts
```

--------------------------------

### Install UnoCSS Packages

Source: https://wxt.dev/unocss.html

Install the necessary UnoCSS packages using your preferred package manager.

```sh
npm i --save-dev @wxt-dev/unocss unocss
```

```sh
pnpm i -D @wxt-dev/unocss unocss
```

```sh
yarn add --dev @wxt-dev/unocss unocss
```

```sh
bun add -D @wxt-dev/unocss unocss
```

--------------------------------

### Example Plugins Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/resolvedconfig

An array of strings used to import WXT plugins. These paths should be resolvable by Vite and the exported default should be a `defineWxtPlugin` function.

```typescript
['@wxt-dev/module-vue/plugin', 'wxt-module-google-analytics/plugin'];
```

--------------------------------

### Install WXT dependency

Source: https://wxt.dev/guide/installation.html

Add WXT as a development dependency to the project.

```sh
pnpm i -D wxt
```

```sh
bun add -D wxt
```

```sh
npm i -D wxt
```

```sh
yarn add --dev wxt
```

--------------------------------

### Install a WXT Module

Source: https://wxt.dev/guide/essentials/wxt-modules

To use a published module, install it via NPM and add its name to the `modules` array in your `wxt.config.ts`.

```typescript
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
});
```

--------------------------------

### Create a wxt Development Server

Source: https://wxt.dev/api/reference/wxt/functions/createserver

Use this function to initialize a development server for your wxt extension. It requires an optional configuration object and must be awaited. The returned server instance has a start() method to begin serving.

```typescript
const server = await wxt.createServer({
    // Enter config...
  });
  await server.start();
```

--------------------------------

### Install WXT Latest, Skipping Scripts

Source: https://wxt.dev/guide/resources/upgrading

Use this command to install the latest WXT version while ignoring scripts, preventing potential errors during major version upgrades.

```sh
pnpm i wxt@latest --ignore-scripts
```

--------------------------------

### Package JSON Version Example

Source: https://wxt.dev/guide/essentials/config/manifest

Shows how the `version` and `version_name` in the output manifest.json are derived from the `version` field in `package.json`.

```json
// package.json
{
  "version": "1.3.0-alpha2"
}
```

```json
// .output/<target>/manifest.json
{
  "version": "1.3.0",
  "version_name": "1.3.0-alpha2"
}
```

--------------------------------

### Listen on WxtBuilderServer

Source: https://wxt.dev/api/reference/wxt/interfaces/wxtbuilderserver

Call the 'listen' method to start the WXT development server. This method returns a Promise that resolves when the server is ready to accept connections.

```typescript
listen(): Promise<void>
```

--------------------------------

### Handling Entrypoint Limitations

Source: https://wxt.dev/guide/essentials/extension-apis

Example of the error message encountered when accessing APIs outside of the main function.

```plaintext
✖ Command failed after 440 ms

 ERROR  Browser.action.onClicked.addListener not implemented.
```

--------------------------------

### Build and Zip for Firefox

Source: https://wxt.dev/guide/essentials/publishing

Commands to install dependencies and generate a source-code-inclusive ZIP for Firefox submission.

```sh
pnpm i
pnpm zip:firefox
```

```sh
npm i
npm run zip:firefox
```

```sh
yarn
yarn zip:firefox
```

```sh
bun install
bun run zip:firefox
```

--------------------------------

### Add `wxt prepare` to `postinstall` script

Source: https://wxt.dev/guide/essentials/config/auto-imports.html

Ensure TypeScript and your editor recognize auto-imported variables by adding `wxt prepare` to your `package.json`'s `postinstall` script. This command should be run after dependencies are installed.

```jsonc
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare", 
  },
}
```

--------------------------------

### Load Generated File at Runtime

Source: https://wxt.dev/guide/essentials/wxt-modules

Example of how to fetch a generated file that has been made web accessible. This code runs in the browser context.

```typescript
const res = await fetch(browser.runtime.getURL('/some-text.txt'));
```

--------------------------------

### Define Content Script Entrypoint Options

Source: https://wxt.dev/guide/essentials/entrypoints

Example of defining manifest options for a content script entrypoint using `defineContentScript`. This specifies the URLs the script should match.

```typescript
export default defineContentScript({
  matches: ['*://*.wxt.dev/*'],
  main() {
    // ...
  },
});
```

--------------------------------

### Add Build-Time Module Options

Source: https://wxt.dev/guide/essentials/wxt-modules

Define build-time options for your module by creating an interface and augmenting WXT's `InlineConfig`. The options are then available in the `setup` function.

```typescript
import { defineWxtModule } from 'wxt/modules';
import 'wxt';

export interface MyModuleOptions {
  // Add your build-time options here...
}
declare module 'wxt' {
  export interface InlineConfig {
    // Add types for the "myModule" key in wxt.config.ts
    myModule: MyModuleOptions;
  }
}

export default defineWxtModule<AnalyticModuleOptions>({
  configKey: 'myModule',

  // Build time config is available via the second argument of setup
  setup(wxt, options) {
    console.log(options);
  },
});
```

--------------------------------

### Create Integrated Content Script UIs

Source: https://wxt.dev/guide/essentials/content-scripts

Implement integrated UIs using various frameworks. These examples demonstrate how to mount and unmount components within the content script context.

```ts
// entrypoints/example-ui.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Append children to the container
        const app = document.createElement('p');
        app.textContent = '...';
        container.append(app);
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```ts
// entrypoints/example-ui.content/index.ts
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Create the app and mount it to the UI container
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app.unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```tsx
// entrypoints/example-ui.content/index.tsx
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root.unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```ts
// entrypoints/example-ui.content/index.ts
import App from './App.svelte';
import { mount, unmount } from 'svelte';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Create the Svelte app inside the UI container
        return mount(App, { target: container });
      },
      onRemove: (app) => {
        // Destroy the app when the UI is removed
        unmount(app);
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

```tsx
// entrypoints/example-ui.content/index.ts
import { render } from 'solid-js/web';

export default defineContentScript({
  matches: ['<all_urls>'],

  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Render your app to the UI container
        const unmount = render(() => <div>...</div>, container);
        return unmount;
      },
      onRemove: (unmount) => {
        // Unmount the app when the UI is removed
        unmount();
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
```

--------------------------------

### Bootstrap a WXT project

Source: https://wxt.dev/guide/installation.html

Initialize a new project using the WXT CLI tool.

```sh
pnpm dlx wxt@latest init
```

```sh
bunx wxt@latest init
```

```sh
npx wxt@latest init
```

```sh
# Use NPM initially, but select Yarn when prompted
npx wxt@latest init
```

--------------------------------

### Disable Extension Installation in Browser

Source: https://wxt.dev/api/reference/wxt/interfaces/webextconfig

Set the 'disabled' property to true to prevent the extension from being installed in the browser when it starts.

```typescript
false
```

--------------------------------

### Basic WXT Module Structure

Source: https://wxt.dev/guide/essentials/wxt-modules

A basic WXT module is defined using `defineWxtModule`. The `setup` function receives the `wxt` object for interacting with the build process. Place local modules in the `modules/` directory for automatic discovery.

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    // Your module code here...
  },
});
```

--------------------------------

### Example Vitest Unit Tests for WXT

Source: https://wxt.dev/guide/essentials/unit-testing

Demonstrates unit tests for WXT extensions using Vitest. It shows how to leverage `@webext-core/fake-browser` for in-memory storage and tests a simple `isLoggedIn` function.

```typescript
import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

const accountStorage = storage.defineItem<Account>('local:account');

async function isLoggedIn(): Promise<Account> {
  const value = await accountStorage.getValue();
  return value != null;
}

describe('isLoggedIn', () => {
  beforeEach(() => {
    // See https://webext-core.aklinker1.io/fake-browser/reseting-state
    fakeBrowser.reset();
  });

  it('should return true when the account exists in storage', async () => {
    const account: Account = {
      username: '...',
      preferences: {
        // ...
      },
    };
    await accountStorage.setValue(account);

    expect(await isLoggedIn()).toBe(true);
  });

  it('should return false when the account does not exist in storage', async () => {
    await accountStorage.deleteValue();

    expect(await isLoggedIn()).toBe(false);
  });
});
```

--------------------------------

### Initialize a project directory

Source: https://wxt.dev/guide/installation.html

Create a new directory and initialize the package manager.

```sh
cd my-project
pnpm init
```

```sh
cd my-project
bun init
```

```sh
cd my-project
npm init
```

```sh
cd my-project
yarn init
```

--------------------------------

### Basic SPA Content Script Example

Source: https://wxt.dev/guide/essentials/content-scripts

This is a basic content script for YouTube that logs a message when loaded. It demonstrates the challenge of SPA navigation where content scripts don't automatically rerun.

```typescript
export default defineContentScript({
  matches: ['*://*.youtube.com/watch*'],
  main(ctx) {
    console.log('YouTube content script loaded');

    mountUi(ctx);
  },
});

function mountUi(ctx: ContentScriptContext): void {
  // ...
}
```

--------------------------------

### Initialize a new WXT project

Source: https://wxt.dev/guide/resources/migrate

Use this command to create a new vanilla WXT project as a reference for your migration.

```sh
cd path/to/your/project
pnpm dlx wxt@latest init example-wxt --template vanilla
```

--------------------------------

### Verify Script Started Event

Source: https://wxt.dev/api/reference/wxt/utils/content-script-context/classes/contentscriptcontext

Verifies if a given event is a script started event.

```typescript
ctx.verifyScriptStartedEvent(event);
```

--------------------------------

### Define HTML Entrypoint Options for Page Action (MV2)

Source: https://wxt.dev/guide/essentials/entrypoints

Example of configuring manifest options for an HTML entrypoint using a meta tag. This sets the entrypoint type to `page_action` for Manifest V2.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta name="manifest.type" content="page_action" />
  </head>
</html>
```

--------------------------------

### createServer()

Source: https://wxt.dev/api/reference/wxt/functions/createserver

Creates a dev server and pre-builds all the files that need to exist before loading the extension.

```APIDOC
## POST /api/reference/wxt/functions/createServer.md

### Description
Creates a dev server and pre-builds all the files that need to exist before loading the extension.

### Method
POST

### Endpoint
/api/reference/wxt/functions/createServer.md

### Parameters
#### Path Parameters
- **inlineConfig** (InlineConfig) - Optional - Configuration for the inline setup.

### Request Example
```json
{
  "inlineConfig": {
    "//": "Enter config..."
  }
}
```

### Response
#### Success Response (200)
- **WxtDevServer** (Promise<WxtDevServer>) - A promise that resolves to the WxtDevServer instance.

#### Response Example
```json
{
  "server": "// WxtDevServer instance"
}
```
```

--------------------------------

### Function: prepare()

Source: https://wxt.dev/api/reference/wxt/functions/prepare

The prepare() function initializes and configures your WXT project. It accepts an inline configuration object and returns a Promise that resolves when preparation is complete.

```APIDOC
## Function: prepare()

### Description
Initializes and configures your WXT project with the provided inline configuration.

### Method
N/A (This is a function call, not an HTTP method)

### Endpoint
N/A

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```javascript
import { prepare } from 'wxt'

await prepare({
  // Your inline configuration options here
})
```

### Response
#### Success Response (void)
This function returns a Promise that resolves with no value upon successful preparation.

#### Response Example
```json
// No response body, the promise resolves successfully
```
```

--------------------------------

### webExt Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig

Configures browser startup options, which can be overridden by a `web-ext.config.ts` file.

```APIDOC
## webExt

### Description

Configure browser startup. Options set here can be overridden in a `web-ext.config.ts` file.

### Type

[`WebExtConfig`](WebExtConfig.md)
```

--------------------------------

### Unlisted CSS Example

Source: https://wxt.dev/guide/essentials/entrypoints

CSS entrypoints are always unlisted. This example shows a basic CSS structure.

```css
body {
  /* ... */
}
```

--------------------------------

### Installing Browser Types Dependency

Source: https://wxt.dev/guide/essentials/extension-apis

Install the browser types package to support custom type augmentation.

```sh
pnpm add @wxt-dev/browser
```

--------------------------------

### Configure Options Entrypoint

Source: https://wxt.dev/guide/essentials/entrypoints

Sets up an options page with specific manifest configurations like open_in_tab and browser styles.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Options Title</title>

    <!-- Customize the manifest options -->
    <meta name="manifest.open_in_tab" content="true|false" />
    <meta name="manifest.chrome_style" content="true|false" />
    <meta name="manifest.browser_style" content="true|false" />

    <!-- Set include/exclude if the page should be removed from some builds -->
    <meta name="manifest.include" content="['chrome', ...]" />
    <meta name="manifest.exclude" content="['chrome', ...]" />
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

--------------------------------

### Install Storage Module without WXT

Source: https://wxt.dev/storage.html

Install the WXT storage NPM package if you are not using WXT. Supports npm, pnpm, yarn, and bun.

```bash
npm i @wxt-dev/storage
pnpm add @wxt-dev/storage
yarn add @wxt-dev/storage
bun add @wxt-dev/storage
```

```typescript
import { storage } from '@wxt-dev/storage';
```

--------------------------------

### Entrypoint Directory with Related Files

Source: https://wxt.dev/guide/essentials/entrypoints

Illustrates how to organize related files within an entrypoint directory.

```html
📂 entrypoints/
   📂 popup/
      📄 index.html     ← This file is the entrypoint
      📄 main.ts
      📄 style.css
   📂 background/
      📄 index.ts       ← This file is the entrypoint
      📄 alarms.ts
      📄 messaging.ts
   📂 youtube.content/
      📄 index.ts       ← This file is the entrypoint
      📄 style.css
```

--------------------------------

### Function: initialize()

Source: https://wxt.dev/api/reference/wxt/functions/initialize

Initializes a WXT project with the provided options. This function returns a Promise that resolves when the initialization is complete.

```APIDOC
## Function: initialize()

### Description
Initializes a WXT project with the provided options. This function returns a Promise that resolves when the initialization is complete.

### Method
N/A (This is a function call, not an HTTP endpoint)

### Endpoint
N/A

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
N/A

### Request Example
```javascript
initialize({
  directory: "./my-wxt-app",
  packageManager: "npm",
  template: "react"
});
```

### Response
#### Success Response (void)
This function does not return a value upon successful completion, but resolves a Promise.

#### Response Example
N/A (Promise resolves with no value)
```

--------------------------------

### Set Start URLs for Browser Tabs

Source: https://wxt.dev/runner.html

Configure the runner to open specific URLs in new tabs when the browser starts by including them in the 'chromiumArgs' or 'firefoxArgs' arrays.

```typescript
import { run } from '@wxt-dev/runner';

await run({
  extensionDir: 'path/to/extension',
  chromiumArgs: ['https://example.com'],
  firefoxArgs: ['https://example.com'],
});
```

--------------------------------

### Disable WXT runner for manual installation

Source: https://wxt.dev/guide/resources/faq

Use this configuration in wxt.config.ts to disable the automatic browser runner, allowing for manual extension installation in a regular Chrome profile.

```ts
// wxt.config.ts
export default defineConfig({
  webExt: {
    disabled: true,
  },
});
```

--------------------------------

### startUrls Configuration

Source: https://wxt.dev/api/reference/wxt/interfaces/webextconfig

Specifies the URLs that should be opened when the extension is loaded.

```APIDOC
## startUrls

### Description
An array of URLs to be opened automatically when the extension is launched or reloaded.

### Type
`string[]`

### See
https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#start-url
```

--------------------------------

### verifyScriptStartedEvent()

Source: https://wxt.dev/api/reference/wxt/utils/content-script-context/classes/contentscriptcontext

Verifies if a given event is a script started event.

```APIDOC
## verifyScriptStartedEvent(event)

### Description
Verifies if a given event is a script started event.

### Method
(Implicitly a method of the context object)

### Endpoint
N/A (Client-side function)

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Parameters
- **event** (`CustomEvent<any>`) - The event to verify.

### Returns
- **boolean** - `true` if the event is a script started event, `false` otherwise.

### Example
```ts
const isScriptStart = ctx.verifyScriptStartedEvent(someEvent);
console.log('Is script started event:', isScriptStart);
```
```

--------------------------------

### Run WXT Prepare

Source: https://wxt.dev/guide/resources/upgrading

After addressing breaking changes, run this command to prepare your project for the new WXT version. This step should resolve type errors.

```sh
pnpm wxt prepare
```

--------------------------------

### Script Entrypoint Options

Source: https://wxt.dev/api/reference/wxt/interfaces/basecontentscriptentrypointoptions

Configuration options for script entrypoints in WXT.

```APIDOC
## Script Entrypoint Options

This section details the configuration options available for script entrypoints within WXT.

### include

> **include**?: `string`[]

List of target browsers to include this entrypoint in. Defaults to being included in all builds. Cannot be used with `exclude`. You must choose one of the two options.

#### Default

```ts
undefined
```

#### Inherited from

[`BaseScriptEntrypointOptions`](BaseScriptEntrypointOptions.md).[`globalName`](BaseScriptEntrypointOptions.md#globalname)

### includeGlobs

> **includeGlobs**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`undefined` | `string`[]>

See https://developer.chrome.com/docs/extensions/mv3/content_scripts/

#### Default

```ts
[ ]
```

### matchAboutBlank

> **matchAboutBlank**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`undefined` | `boolean`>

See https://developer.chrome.com/docs/extensions/mv3/content_scripts/

#### Default

```ts
false
```

### matchOriginAsFallback

> **matchOriginAsFallback**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`boolean`>

See https://developer.chrome.com/docs/extensions/mv3/content_scripts/

#### Default

```ts
false
```

### matches

> **matches**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`string`[]>

### registration

> **registration**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`"runtime"` | `"manifest"`>

Specify how the content script is registered.

* `"manifest"`: The content script will be added to the `content_scripts` entry in the manifest. This is the normal and most well known way of registering a content script.
* `"runtime"`: The content script's `matches` is added to `host_permissions` and you are responsible for using the scripting API to register/execute the content script dynamically at runtime.

#### Default

```ts
'manifest'
```

### runAt

> **runAt**?: [`PerBrowserOption`](../type-aliases/PerBrowserOption.md)<`undefined` | `RunAt`>

See https://developer.chrome.com/docs/extensions/mv3/content_scripts/

#### Default

```ts
'documentIdle'
```
```

--------------------------------

### Get WXT Version

Source: https://wxt.dev/api/reference/wxt/variables/version

Retrieves the current version of the WXT library.

```APIDOC
## GET /api/reference/wxt/variables/version

### Description
Retrieves the current version of the WXT library.

### Method
GET

### Endpoint
/api/reference/wxt/variables/version

### Response
#### Success Response (200)
- **version** (string) - The current version of WXT.

#### Response Example
```json
{
  "version": "1.2.3"
}
```
```

--------------------------------

### Storage API - Get Metas

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/wxtstorage

Retrieves metadata for multiple storage items.

```APIDOC
## GET /api/storage/metas

### Description
Retrieves metadata for multiple storage items.

### Method
GET

### Endpoint
/api/storage/metas

### Query Parameters
- **keys** (Array<string | WxtStorageItem>) - Required - A list of keys or items to retrieve metadata for.

### Response
#### Success Response (200)
- **Array<object>** - An array containing storage keys and their metadata.

### Request Example
```ts
await storage.getMetas(['local:installDate', 'session:someCounter']);
```
```

--------------------------------

### Define Environment Variables

Source: https://wxt.dev/guide/essentials/config/environment-variables

Example of defining a custom environment variable in a .env file.

```sh
# .env
WXT_API_KEY=...
```

--------------------------------

### ready Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/wxthooks

This hook is called after WXT modules are initialized and the WXT instance is ready to be used. Note that `wxt.server` is not yet available.

```APIDOC
## ready Hook

### Description
Called after WXT modules are initialized, when the WXT instance is ready to be used. `wxt.server` isn't available yet, use `server:created` to get it.

### Parameters

- **wxt** (Wxt) - The configured WXT object
```

--------------------------------

### Importing with Custom Aliases

Source: https://wxt.dev/guide/essentials/config/typescript

Example of how to import modules using the custom aliases defined in wxt.config.ts.

```typescript
import { fakeTab } from 'testing/fake-objects';
import { toLowerCase } from 'strings';
```

--------------------------------

### Entrypoint Folder Structure (Single File)

Source: https://wxt.dev/guide/essentials/entrypoints

Defines a single file as an entrypoint within the `entrypoints/` directory.

```html
📂 entrypoints/
   📄 {name}.{ext}
```

--------------------------------

### Define Basic WebExt Config

Source: https://wxt.dev/guide/essentials/config/browser-startup

Use `defineWebExtConfig` to configure browser startup options in `web-ext.config.ts`. This file is ignored by version control.

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // ...
});
```

--------------------------------

### Example Exclude Files Pattern

Source: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig

Uses Picomatch patterns to exclude files from the extension zip, such as sourcemaps.

```typescript
'**/*.map'
```

--------------------------------

### Configure Umami credentials

Source: https://wxt.dev/analytics.html

Set the website ID and domain in your .env file for Umami.

```dotenv
WXT_UMAMI_WEBSITE_ID='...'
WXT_UMAMI_DOMAIN='...'
```

--------------------------------

### Zip Hooks

Source: https://wxt.dev/api/reference/wxt/interfaces/wxthooks

Hooks related to the zip process, including start, done, extension zip, and sources zip.

```APIDOC
## zip:start

### Description
Called before the zip process starts.

### Method
(wxt) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  }
}
```

### Response Example
```json
{
  "result": "success"
}
```

## zip:done

### Description
Called after the entire zip process is complete.

### Method
(wxt, zipFiles) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object
- **zipFiles** (string[]) - An array of paths to all created zip files

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  },
  "zipFiles": ["/path/to/file1.zip", "/path/to/file2.zip"]
}
```

### Response Example
```json
{
  "result": "success"
}
```

## zip:extension:start

### Description
Called before zipping the extension files.

### Method
(wxt) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  }
}
```

### Response Example
```json
{
  "result": "success"
}
```

## zip:extension:done

### Description
Called after zipping the extension files.

### Method
(wxt, zipPath) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object
- **zipPath** (string) - The path to the created extension zip file

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  },
  "zipPath": "/path/to/extension.zip"
}
```

### Response Example
```json
{
  "result": "success"
}
```

## zip:sources:start

### Description
Called before zipping the source files (for Firefox).

### Method
(wxt) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  }
}
```

### Response Example
```json
{
  "result": "success"
}
```

## zip:sources:done

### Description
Called after zipping the source files (for Firefox).

### Method
(wxt, zipPath) => HookResult

### Parameters
#### Request Body
- **wxt** (Wxt) - The configured WXT object
- **zipPath** (string) - The path to the created sources zip file

### Response
#### Success Response (200)
- **HookResult** (HookResult) - The result of the hook.

### Request Example
```json
{
  "wxt": {
    "config": {}
  },
  "zipPath": "/path/to/sources.zip"
}
```

### Response Example
```json
{
  "result": "success"
}
```
```

--------------------------------

### WebExtConfig Interface Properties

Source: https://wxt.dev/api/reference/wxt/interfaces/webextconfig

Details on the configurable properties for web-ext browser startup.

```APIDOC
## WebExtConfig Interface

Options for how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser.

### Properties

#### binaries

> **binaries**?: `Record<string, string>`

List of browser names and the binary that should be used to open the browser.

See:
* https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-binary
* https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox

#### chromiumArgs

> **chromiumArgs**?: `string`[]

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args

#### chromiumPort

> **chromiumPort**?: `number`

By default, chrome opens a random port for debugging. Set this value to use a specific port.

#### chromiumPref

> **chromiumPref**?: `Record<string, any>`

An map of chrome preferences from https://chromium.googlesource.com/chromium/src/+/main/chrome/common/pref_names.h

Example:
```ts
// change your downloads directory
  {
  download: {
  default_directory: "/my/custom/dir",
  },
  }
```

Default:
```ts
// Enable dev mode and allow content script sourcemaps
{
  devtools: {
    synced_preferences_sync_disabled: {
      skipContentScripts: false,
    },
  }
  extensions: {
    ui: {
      developer_mode: true,
    },
  }
}
```

#### chromiumProfile

> **chromiumProfile**?: `string`

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-profile

#### disabled

> **disabled**?: `boolean`

Whether or not to open the browser with the extension installed in dev mode.

Default:
```ts
false
```

#### firefoxArgs

> **firefoxArgs**?: `string`[]

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args

#### firefoxPref

> **firefoxPref**?: `Record<string, string | number | boolean>`

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#pref

#### firefoxProfile

> **firefoxProfile**?: `string`

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox-profile

#### keepProfileChanges

> **keepProfileChanges**?: `boolean`

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#keep-profile-changes

#### openConsole

> **openConsole**?: `boolean`

See: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#browser-console

```

--------------------------------

### server:created Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/wxthooks

This hook is called when the development server is created and `wxt.server` is assigned. The server has not started yet.

```APIDOC
## server:created Hook

### Description
Called when the dev server is created (and `wxt.server` is assigned). Server has not been started yet.

### Parameters

- **wxt** (Wxt) - The configured WXT object
- **server** (WxtDevServer) - Same as `wxt.server`, the object WXT uses to control the dev server.
```

--------------------------------

### Configure package.json scripts

Source: https://wxt.dev/guide/installation.html

Add WXT commands to the scripts section of package.json.

```json
{
  "scripts": {
    "dev": "wxt", 
    "dev:firefox": "wxt -b firefox", 
    "build": "wxt build", 
    "build:firefox": "wxt build -b firefox", 
    "zip": "wxt zip", 
    "zip:firefox": "wxt zip -b firefox", 
    "postinstall": "wxt prepare"
  }
}
```

--------------------------------

### snapshot() - Get all items

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/wxtstorage

Retrieves all items currently stored. This function returns a promise that resolves with a record of all stored items.

```APIDOC
## snapshot()

### Description
Return all the items in storage.

### Method
`Promise<Record<string, unknown>>`

### Parameters
#### Path Parameters
- None

#### Query Parameters
- None

#### Request Body
- None

### Request Example
```json
{
  "example": "snapshot()"
}
```

### Response
#### Success Response (200)
- **items** (Record<string, unknown>) - An object containing all stored key-value pairs.

#### Response Example
```json
{
  "example": "{\"key1\": \"value1\", \"key2\": 123}"
}
```
```

--------------------------------

### Using Vite-specific APIs in Entrypoint Options

Source: https://wxt.dev/guide/resources/upgrading

Shows how to use Vite-specific APIs like `import.meta.glob` to define entrypoint options, allowing for dynamic loading of modules.

```typescript
const providers: Record<string, any> = import.meta.glob('../providers/*', {
  eager: true,
});

export default defineContentScript({
  matches: Object.values(providers).flatMap(
    (provider) => provider.default.paths,
  ),
  async main() {
    console.log('Hello content.');
  },
});
```

--------------------------------

### Configure Auto-imports in WXT

Source: https://wxt.dev/guide/essentials/config/auto-imports.html

Set up auto-imports by configuring the `imports` option in `defineConfig`. This example shows the basic structure for unimport configurations.

```typescript
export default defineConfig({
  // See https://www.npmjs.com/package/unimport#configurations
  imports: {
    // ...
  },
});
```

--------------------------------

### Entrypoint Folder Structure (Directory)

Source: https://wxt.dev/guide/essentials/entrypoints

Defines a directory with an `index` file as an entrypoint within the `entrypoints/` directory.

```html
📂 entrypoints/
   📂 {name}/
      📄 index.{ext}
```

--------------------------------

### Importing Utilities from '#imports'

Source: https://wxt.dev/guide/resources/upgrading

Demonstrates replacing old import paths for 'wxt/storage', 'wxt/sandbox', and 'wxt/client' with the new unified '#imports' virtual module.

```typescript
import { storage } from 'wxt/storage'; // [!code --]
import { defineContentScript } from 'wxt/sandbox'; // [!code --]
import { ContentScriptContext, useAppConfig } from 'wxt/client'; // [!code --]
import { storage } from '#imports'; // [!code ++]
import { defineContentScript } from '#imports'; // [!code ++]
import { ContentScriptContext, getAppConfig } from '#imports'; // [!code ++]
```

--------------------------------

### Suppress Firefox Data Collection Warnings

Source: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig

Example of how to suppress specific warnings during the build process, such as those related to Firefox data collection.

```typescript
export default defineConfig({
  suppressWarnings: {
    firefoxDataCollection: true,
  },
})
```

--------------------------------

### Storage API - Get Meta

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/wxtstorage

Retrieves metadata associated with a specific storage key. If the metadata is not an object, an empty object is returned.

```APIDOC
## GET /api/storage/meta/{key}

### Description
Retrieves metadata for a given storage key.

### Method
GET

### Endpoint
/api/storage/meta/{key}

### Parameters
#### Path Parameters
- **key** (string) - Required - The storage key to retrieve metadata for (e.g., 'local:installDate').

### Response
#### Success Response (200)
- **Record<string, unknown>** - An object containing the metadata for the specified key.

### Request Example
```ts
await storage.getMeta('local:installDate');
```
```

--------------------------------

### Example absoluteSrc Path

Source: https://wxt.dev/api/reference/wxt/interfaces/copiedpublicfile

Represents the absolute path to a file that will be copied to the output directory. Use this to specify the exact location of the source file.

```typescript
'/path/to/any/file.css';
```