### Run development mode

Source: https://wxt.dev/guide/installation

Start the development server to automatically open the browser with the extension installed.

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

### Background Entrypoint Examples (HTML)

Source: https://wxt.dev/guide/essentials/entrypoints

Illustrates how to define a 'Background' entrypoint, which can be a single file named `background.ts` or a directory named `background` containing an `index.ts` file. This highlights the flexibility in naming and structuring entrypoints.

```html
📂 entrypoints/
   📄 background.ts
```

```html
📂 entrypoints/
   📂 background/
      📄 index.ts
```

--------------------------------

### Entrypoint Folder Structure Examples (HTML)

Source: https://wxt.dev/guide/essentials/entrypoints

Demonstrates the two valid ways to define an entrypoint within the `entrypoints/` directory: as a single file or as a directory containing an `index` file. The name of the file or directory determines the entrypoint's type.

```html
📂 entrypoints/
   📄 {name}.{ext}
```

```html
📂 entrypoints/
   📂 {name}/
      📄 index.{ext}
```

--------------------------------

### Example wxtDir Path

Source: https://wxt.dev/api/reference/wxt/interfaces/ResolvedConfig

This example shows the absolute path format for the `.wxt` directory in the project root.

```typescript
'/path/to/project/.wxt';
```

--------------------------------

### Defining HTML Entrypoint Options (HTML)

Source: https://wxt.dev/guide/essentials/entrypoints

Shows how to configure manifest options for an HTML entrypoint by embedding `<meta>` tags within the HTML's `<head>` section. This example demonstrates setting the `manifest.type` to `page_action` for an MV2 popup.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta name="manifest.type" content="page_action" />
  </head>
</html>
```

--------------------------------

### Basic YouTube Content Script Initialization in WXT

Source: https://wxt.dev/guide/essentials/content-scripts

A basic content script example for YouTube that logs a message upon loading and calls a mountUi function. This serves as a starting point before implementing SPA navigation handling.

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

### Create and Start Wxt Dev Server

Source: https://wxt.dev/api/reference/wxt/functions/createServer

Use this snippet to create a new Wxt development server with custom configuration and then start it. Ensure the 'wxt' object is available in your scope.

```typescript
const server = await wxt.createServer({
    // Enter config...
  });
  await server.start();
```

--------------------------------

### Install @wxt-dev/i18n

Source: https://wxt.dev/i18n

Install the package using your preferred package manager.

```sh
pnpm i @wxt-dev/i18n
```

--------------------------------

### Install @wxt-dev/is-background

Source: https://wxt.dev/is-background

The installation command for the package using the pnpm package manager.

```shell
pnpm add @wxt-dev/is-background
```

--------------------------------

### Install @wxt-dev/auto-icons

Source: https://wxt.dev/auto-icons

Install the auto-icons package using your preferred package manager.

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

### defineWebExtConfig() Configuration

Source: https://wxt.dev/api/reference/wxt/functions/defineWebExtConfig

Configures how web-ext starts the browser during development.

```APIDOC
## Function: defineWebExtConfig()

### Description
Configure how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser during development.

### Parameters
#### Request Body
- **config** (WebExtConfig) - Required - Configuration object for web-ext.

### Request Example
```json
{
  "config": {
    "//": "Example WebExtConfig object"
  }
}
```

### Response
#### Success Response (200)
- **WebExtConfig** (object) - The configuration object that was applied.

#### Response Example
```json
{
  "//": "Example WebExtConfig object"
}
```
```

--------------------------------

### Install Webextension Polyfill and WXT Polyfill Module

Source: https://wxt.dev/guide/resources/upgrading

Install the webextension-polyfill and WXT's new polyfill module if you choose to continue using the polyfill during the upgrade process. This allows for a smoother transition without immediate polyfill removal.

```sh
pnpm i webextension-polyfill @wxt-dev/webextension-polyfill
```

--------------------------------

### Configure Sandbox Page using HTML Meta Tags

Source: https://wxt.dev/guide/essentials/entrypoints

This HTML snippet illustrates the setup for a sandboxed page in a browser extension. It includes meta tags for build inclusion/exclusion. Note that sandboxed pages are a Chromium-specific feature and are not supported in Firefox.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Title</title>

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

### Migrate DOM Manipulation to Unlisted Script

Source: https://wxt.dev/guide/essentials/entrypoints

Example demonstrating how to migrate DOM manipulation code from a standard script to an unlisted script. This ensures the code runs within the correct context provided by `defineUnlistedScript`.

```typescript
document.querySelectorAll('a').forEach((anchor) => { // [!code --]
  // ... // [!code --]
}); // [!code --]

export default defineUnlistedScript(() => {
  document.querySelectorAll('a').forEach((anchor) => { // [!code ++]
    // ... // [!code ++]
  }); // [!code ++]
});
```

--------------------------------

### Unlisted CSS Configuration

Source: https://wxt.dev/guide/essentials/entrypoints

Example of unlisted CSS for a web extension project. CSS entry points are always unlisted. This snippet shows a basic CSS rule and references Vite's guide for preprocessor setup.

```css
body {
  /* ... */
}
```

--------------------------------

### Install Analytics Without WXT

Source: https://wxt.dev/analytics

Guides on installing and setting up the WXT analytics package independently of the WXT build system. This involves creating a standalone analytics instance and initializing it in the background script.

```bash
pnpm i @wxt-dev/analytics
```

```typescript
// utils/analytics.ts
import { createAnalytics } from '@wxt-dev/analytics';

export const analytics = createAnalytics({
  providers: [
    // ...
  ],
});
```

```typescript
// background.ts
import './utils/analytics';
```

--------------------------------

### outDirTemplate Example

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Example of a template string for customizing the output directory structure. Available variables include {{browser}}, {{manifestVersion}}, {{mode}}, {{modeSuffix}}, and {{command}}.

```typescript
{{browser}} -mv{{manifestVersion}}
```

--------------------------------

### Initialize a New WXT Project

Source: https://wxt.dev/guide/resources/migrate

Command to create a new WXT project with the vanilla template. This is the recommended starting point for migration.

```shell
cd path/to/your/project
pnpm dlx wxt@latest init example-wxt --template vanilla
```

--------------------------------

### Define download packages

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Example showing correct and incorrect usage for specifying private packages to include in the sources ZIP.

```ts
// Correct:
  ['@scope/package-name', 'package-name'][
    // Incorrect, don't include versions!!!
    ('@scope/package-name@1.1.3', 'package-name@^2')
  ];
```

--------------------------------

### server:started Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/WxtHooks

This hook is called when the development server has started.

```APIDOC
## server:started

### Description
Called when the dev server is started.

### Parameters

#### Path Parameters
- **wxt** (Wxt) - Required - The configured WXT object
- **server** (WxtDevServer) - Required - Same as `wxt.server`, the object WXT uses to control the dev server.

### Source
[packages/wxt/src/types.ts:1408](https://github.com/wxt-dev/wxt/blob/09b5a1957708ad4fdf5d15bbc65ea2097949f568/packages/wxt/src/types.ts#L1408)
```

--------------------------------

### Example Unit Tests with Vitest and Fake Browser

Source: https://wxt.dev/guide/essentials/unit-testing

Demonstrates writing unit tests using Vitest and the fake-browser API provided by WXT. This example shows how to test storage interactions without manual mocking, as the fake-browser implements storage in-memory.

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

### Configure Chromium Preferences

Source: https://wxt.dev/api/reference/wxt/interfaces/WebExtConfig

Examples showing how to set custom Chromium preferences, such as the download directory, and the default configuration for developer mode.

```ts
// change your downloads directory
  {
  download: {
  default_directory: "/my/custom/dir",
  },
  }
```

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

--------------------------------

### Defining Content Script Entrypoint Options (TypeScript)

Source: https://wxt.dev/guide/essentials/entrypoints

Demonstrates how to define manifest options for a content script entrypoint directly within the script file using the `defineContentScript` function. This example shows how to specify the `matches` pattern for the content script.

```typescript
export default defineContentScript({
  matches: ['*://*.wxt.dev/*'],
  main() {
    // ...
  },
});
```

--------------------------------

### Install WXT Skipping Scripts

Source: https://wxt.dev/guide/resources/upgrading

Install the latest WXT version while ignoring scripts to prevent potential errors during major version upgrades. This is the first step before applying other upgrade changes.

```sh
pnpm i wxt@latest --ignore-scripts
```

--------------------------------

### Install UnoCSS Package

Source: https://wxt.dev/unocss

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

### Accessing Assets from the /public Directory

Source: https://wxt.dev/guide/essentials/assets

Shows how to reference files placed in the `<rootDir>/public/` directory. These files are copied directly to the output folder without bundler processing. Access is typically done using absolute paths starting with '/'.

```typescript
import imageUrl from '/image.png';

const img = document.createElement('img');
img.src = imageUrl;
```

```html
<img src="/image.png" />
```

```css
.bg-image {
  background-image: url(/image.png);
}
```

```vue
<template>
  <img src="/image.png" />
</template>
```

```jsx
<img src="/image.png" />
```

--------------------------------

### WxtModuleSetup Type Alias

Source: https://wxt.dev/api/reference/wxt/type-aliases/WxtModuleSetup

Defines the structure of the setup function for WXT modules.

```APIDOC
## Type Alias: WxtModuleSetup<TOptions>

### Description
A function signature used to initialize a WXT module. It receives the Wxt instance and optional module options, returning void or a Promise that resolves to void.

### Type Parameters
- **TOptions** (WxtModuleOptions) - The specific options type for the module.

### Parameters
- **wxt** (Wxt) - The Wxt instance.
- **moduleOptions** (TOptions) - Optional configuration object for the module.

### Source
packages/wxt/src/types.ts:1680
```

--------------------------------

### Capture Stack Trace Example

Source: https://wxt.dev/api/reference/wxt/utils/match-patterns/classes/InvalidMatchPattern

Demonstrates how to manually capture a stack trace on an object using Error.captureStackTrace.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // Similar to `new Error().stack`
```

--------------------------------

### Install WXT as a development dependency

Source: https://wxt.dev/guide/installation

Add the WXT package to your project's dev dependencies.

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

### Include files in sources ZIP

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Example of using Picomatch patterns to include files in the sources ZIP, overriding exclude patterns.

```ts
[
    'coverage', // Include the coverage directory in the `sourcesRoot`
  ];
```

--------------------------------

### server:created Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/WxtHooks

This hook is called when the development server is created and `wxt.server` is assigned. The server has not started yet.

```APIDOC
## server:created

### Description
Called when the dev server is created (and `wxt.server` is assigned). Server has not been started yet.

### Parameters

#### Path Parameters
- **wxt** (Wxt) - Required - The configured WXT object
- **server** (WxtDevServer) - Required - Same as `wxt.server`, the object WXT uses to control the dev server.

### Source
[packages/wxt/src/types.ts:1400](https://github.com/wxt-dev/wxt/blob/09b5a1957708ad4fdf5d15bbc65ea2097949f568/packages/wxt/src/types.ts#L1400)
```

--------------------------------

### Initialize a new WXT project

Source: https://wxt.dev/guide/installation

Use the CLI to bootstrap a new project with your preferred package manager.

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

### createServer()

Source: https://wxt.dev/api/reference/wxt/functions/createServer

Initializes a development server and prepares the environment for extension loading.

```APIDOC
## createServer()

### Description
Creates a dev server and pre-builds all the files that need to exist before loading the extension.

### Parameters
- **inlineConfig** (InlineConfig) - Optional - Configuration object for the dev server.

### Returns
- **Promise<WxtDevServer>** - A promise that resolves to the WxtDevServer instance.

### Request Example
```ts
const server = await wxt.createServer({
  // Enter config...
});
await server.start();
```
```

--------------------------------

### Initialize a project directory

Source: https://wxt.dev/guide/installation

Create a new directory and initialize a package manifest.

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

### Access Unlisted Script URL at Runtime

Source: https://wxt.dev/guide/essentials/entrypoints

TypeScript code to get the runtime URL of an unlisted script. This URL can be used to reference the script from other parts of the extension.

```typescript
const url = browser.runtime.getURL('/{name}.js');

console.log(url); // "chrome-extension://{id}/{name}.js"
```

--------------------------------

### POST /api/reference/wxt/functions/prepare.md

Source: https://wxt.dev/api/reference/wxt/functions/prepare

The prepare function initializes WXT with the provided configuration.

```APIDOC
## POST /api/reference/wxt/functions/prepare.md

### Description
Initializes WXT with the provided inline configuration.

### Method
POST

### Endpoint
/api/reference/wxt/functions/prepare.md

### Parameters
#### Request Body
- **config** (InlineConfig) - Required - The inline configuration object for WXT.

### Request Example
```json
{
  "config": {
    "//": "InlineConfig object details would go here"
  }
}
```

### Response
#### Success Response (200)
- **void** - The function returns a Promise that resolves to void upon successful preparation.

#### Response Example
```json
// No response body is returned on success, the promise resolves.
```
```

--------------------------------

### Define Background Script (TypeScript)

Source: https://wxt.dev/guide/essentials/entrypoints

Defines the background script for a WXT extension. The minimal example shows the basic structure, while the 'With Manifest Options' example demonstrates how to set manifest properties like persistence and type. The `main` function is executed when the background is loaded and cannot be asynchronous. Runtime code should not be placed outside the `main` function.

```typescript
export default defineBackground(() => {
  // Executed when background is loaded
});
```

```typescript
export default defineBackground({
  // Set manifest options
  persistent: undefined | true | false,
  type: undefined | 'module',

  // Set include/exclude if the background should be removed from some builds
  include: undefined | string[],
  exclude: undefined | string[],

  main() {
    // Executed when background is loaded, CANNOT BE ASYNC
  },
});
```

--------------------------------

### Function: initialize()

Source: https://wxt.dev/api/reference/wxt/functions/initialize

Initializes a new WXT project with the provided configuration options.

```APIDOC
## initialize(options)

### Description
Initializes a new WXT project environment.

### Parameters
#### Request Body
- **directory** (string) - Required - The target directory for the project.
- **packageManager** (string) - Required - The package manager to use (e.g., npm, yarn, pnpm).
- **template** (string) - Required - The template to use for the project initialization.

### Response
#### Success Response (200)
- **void** - Returns a promise that resolves when initialization is complete.
```

--------------------------------

### Get Translated Message using i18n API

Source: https://wxt.dev/guide/essentials/i18n

Shows how to retrieve a translated string using the `browser.i18n.getMessage()` function. This function takes a message key as input and returns the corresponding translated string based on the current locale.

```typescript
browser.i18n.getMessage('helloWorld');
```

--------------------------------

### Modify Injected Script Element (TypeScript)

Source: https://wxt.dev/guide/essentials/content-scripts

This TypeScript example demonstrates how to use the `modifyScript` option within `injectScript` to customize the script element before it's added to the DOM. Here, it sets a dataset attribute 'greeting' on the script element.

```typescript
// entrypoints/example.content.ts
export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    await injectScript('/example-main-world.js', {
      modifyScript(script) {
        script.dataset['greeting'] = 'Hello there';
      },
    });
  },
});
```

--------------------------------

### Define Content Script with Main World Access (TypeScript)

Source: https://wxt.dev/guide/essentials/content-scripts

This example demonstrates how to define a content script that runs in the 'MAIN' world, granting it access to all webpage context. Note that this approach is only supported by Chromium browsers and not MV2.

```typescript
export default defineContentScript({
  world: 'MAIN',
});
```

--------------------------------

### Inject Script into Main World (TypeScript)

Source: https://wxt.dev/guide/essentials/content-scripts

This TypeScript example shows a content script that injects another script ('example-main-world.js') into the main world. The `injectScript` function is used, with `keepInDom` set to true, ensuring the script remains in the DOM.

```typescript
// entrypoints/example.content.ts
export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    console.log('Injecting script...');
    await injectScript('/example-main-world.js', {
      keepInDom: true,
    });
    console.log('Done!');
  },
});
```

--------------------------------

### Basic Storage Operations and Watching

Source: https://wxt.dev/storage

Demonstrates how to perform basic CRUD operations with storage keys and how to set up watchers to listen for data changes.

```ts
await storage.getItem<number>('local:installDate');
const unwatch = storage.watch<number>('local:counter', (newCount, oldCount) => {
  console.log('Count changed:', { newCount, oldCount });
});
unwatch();
```

--------------------------------

### Bidirectional Communication via Events (TypeScript)

Source: https://wxt.dev/guide/essentials/content-scripts

This TypeScript example illustrates bidirectional communication between a content script and an injected main-world script using custom events. The content script adds an event listener and dispatches an event, while the injected script listens for and dispatches events.

```typescript
// entrypoints/example.content.ts
export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    const { script } = await injectScript('/example-main-world.js', {
      modifyScript(script) {
        // Add a listener before the injected script is loaded.
        script.addEventListener('from-injected-script', (event) => {
          if (event instanceof CustomEvent) {
            console.log(`${event.type}:`, event.detail);
          }
        });
      },
    });

    // Send an event after the injected script is loaded.
    script.dispatchEvent(
      new CustomEvent('from-content-script', {
        detail: 'General Kenobi',
      }),
    );
  },
});
```

```typescript
// entrypoints/example-main-world.ts
export default defineUnlistedScript(() => {
  const script = document.currentScript;

  script?.addEventListener('from-content-script', (event) => {
    if (event instanceof CustomEvent) {
      console.log(`${event.type}:`, event.detail);
    }
  });

  script?.dispatchEvent(
    new CustomEvent('from-injected-script', {
      detail: 'Hello there',
    }),
  );
});
```

--------------------------------

### Manifest V3 Content Script CSS Configuration (JSON)

Source: https://wxt.dev/guide/essentials/content-scripts

Provides an example of how CSS files are declared for content scripts in a standard browser extension's `manifest.json` file. WXT simplifies this by automatically generating this configuration when CSS files are imported into content script entrypoints.

```json
{
  "content_scripts": [
    {
      "css": ["content/style.css"],
      "js": ["content/index.js"],
      "matches": ["*://*/*"]
    }
  ]
}
```

--------------------------------

### Submit Extension for Release

Source: https://wxt.dev/guide/essentials/publishing

Execute the actual submission of ZIP files to the configured browser stores.

```sh
wxt submit \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

--------------------------------

### Configure Options Page using HTML Meta Tags

Source: https://wxt.dev/guide/essentials/entrypoints

This HTML snippet illustrates how to configure an extension's options page. It uses meta tags within the `<head>` to customize manifest properties like opening in a tab, applying browser styles, and controlling build inclusion. This is useful for WXT projects.

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

### ready Hook

Source: https://wxt.dev/api/reference/wxt/interfaces/WxtHooks

This hook is called after WXT modules are initialized and the WXT instance is ready. Note that `wxt.server` is not yet available.

```APIDOC
## ready

### Description
Called after WXT modules are initialized, when the WXT instance is ready to be used. `wxt.server` isn't available yet, use `server:created` to get it.

### Parameters

#### Path Parameters
- **wxt** (Wxt) - Required - The configured WXT object

### Source
[packages/wxt/src/types.ts:1246](https://github.com/wxt-dev/wxt/blob/09b5a1957708ad4fdf5d15bbc65ea2097949f568/packages/wxt/src/types.ts#L1246)
```

--------------------------------

### Verify Script Started Event

Source: https://wxt.dev/api/reference/wxt/utils/content-script-context/classes/ContentScriptContext

Verifies if a given event is a script started event.

```typescript
verifyScriptStartedEvent(event)
```

--------------------------------

### Including Related Files in Entrypoint Directories (HTML)

Source: https://wxt.dev/guide/essentials/entrypoints

Shows how to organize related files alongside the main `index` file within an entrypoint's directory. This structure is recommended for better organization, preventing WXT from treating unrelated files in the `entrypoints/` directory as separate entrypoints.

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

### Function: build()

Source: https://wxt.dev/api/reference/wxt/functions/build

Bundles the extension for production by discovering and merging configuration from wxt.config.ts.

```APIDOC
## build(config?)

### Description
Bundles the extension for production. Returns a promise of the build result. Discovers the wxt.config.ts file in the root directory, and merges that config with what is passed in.

### Parameters
#### Path Parameters
- **config** (InlineConfig) - Optional - Configuration object to override settings in wxt.config.ts

### Request Example
```ts
// Use config from `wxt.config.ts`
const res = await build();

// or override config `from wxt.config.ts`
const res = await build({
  // Override config...
});
```

### Response
#### Success Response (200)
- **result** (BuildOutput) - A promise resolving to the build output.
```

--------------------------------

### Install WXT Storage Dependency

Source: https://wxt.dev/storage

Commands to install the @wxt-dev/storage package using various package managers for projects not using WXT built-in features.

```sh
npm i @wxt-dev/storage
pnpm add @wxt-dev/storage
yarn add @wxt-dev/storage
bun add @wxt-dev/storage
```

--------------------------------

### Prepare WXT After Upgrade

Source: https://wxt.dev/guide/resources/upgrading

Run the WXT prepare command after applying breaking changes to ensure the project is set up correctly for the new version. This command should succeed and resolve type errors.

```sh
pnpm wxt prepare
```

--------------------------------

### Content Script Entrypoint Options

Source: https://wxt.dev/api/reference/wxt/interfaces/MainWorldContentScriptDefinition

Configuration options for content script execution.

```APIDOC
## Content Script Entrypoint Options

### runAt

> **runAt**?: `PerBrowserOption` < `undefined` | `RunAt` >

Specifies when the content script should be injected.

#### Default

```ts
'documentIdle'
```

### world

> **world**: `"MAIN"`

Specifies the execution world for the content script. Defaults to the main world.
```

--------------------------------

### Install WXT Analytics Module

Source: https://wxt.dev/analytics

Installs the WXT analytics NPM package and configures it within the WXT build process. This involves adding the module to `wxt.config.ts` and setting up providers in `app.config.ts`.

```bash
pnpm i @wxt-dev/analytics
```

```typescript
export default defineConfig({
  modules: ['@wxt-dev/analytics/module'],
});
```

```typescript
// <srcDir>/app.config.ts
import { umami } from '@wxt-dev/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    debug: true,
    providers: [
      // ...
    ],
  },
});
```

--------------------------------

### Define a background entrypoint

Source: https://wxt.dev/guide/installation

Create a background script using the defineBackground helper.

```ts
export default defineBackground(() => {
  console.log('Hello world!');
});
```

--------------------------------

### MainWorldContentScriptEntrypointOptions Interface

Source: https://wxt.dev/api/reference/wxt/interfaces/MainWorldContentScriptEntrypointOptions

Configuration options for defining content script entrypoints in WXT.

```APIDOC
## Interface: MainWorldContentScriptEntrypointOptions

### Description
Defines the configuration options for a content script entrypoint, extending base options with specific browser extension behaviors.

### Properties
- **allFrames** (PerBrowserOption<undefined | boolean>) - Optional - Whether the script should run in all frames. Default: false.
- **cssInjectionMode** (PerBrowserOption<"manifest" | "manual" | "ui">) - Optional - Defines how CSS is injected. Options: 'manifest', 'manual', 'ui'. Default: 'manifest'.
- **exclude** (string[]) - Optional - List of browsers to exclude this entrypoint from.
- **excludeGlobs** (PerBrowserOption<undefined | string[]>) - Optional - Globs to exclude from matching.
- **excludeMatches** (PerBrowserOption<undefined | string[]>) - Optional - URL patterns to exclude from matching.
```

--------------------------------

### Configure package.json scripts

Source: https://wxt.dev/guide/installation

Add WXT CLI commands to your package.json to manage development, building, and zipping.

```json
{
  "scripts": {
    "dev": "wxt", // [!code ++]
    "dev:firefox": "wxt -b firefox", // [!code ++]
    "build": "wxt build", // [!code ++]
    "build:firefox": "wxt build -b firefox", // [!code ++]
    "zip": "wxt zip", // [!code ++]
    "zip:firefox": "wxt zip -b firefox", // [!code ++]
    "postinstall": "wxt prepare" // [!code ++]
  }
}
```

--------------------------------

### Configure WXT to Disable Browser Runner for Manual Extension Installation

Source: https://wxt.dev/guide/resources/faq

This configuration disables WXT's automatic browser runner, allowing manual installation of the extension into a Chrome profile. This is an alternative method for enabling the Prompt API.

```typescript
import { defineConfig } from 'wxt/core';

export default defineConfig({
  webExt: {
    disabled: true,
  },
});
```

--------------------------------

### main() Method

Source: https://wxt.dev/api/reference/wxt/interfaces/MainWorldContentScriptDefinition

The main function executed when the content script is loaded.

```APIDOC
## main()

> **main**(): `any`

Main function executed when the content script is loaded.

When running a content script with `browser.scripting.executeScript`, values returned from this function will be returned in the `executeScript` result as well. Otherwise returning a value does nothing.
```

--------------------------------

### Configuration Options

Source: https://wxt.dev/api/reference/wxt/interfaces/WebExtConfig

Details on available configuration options for the WXT Dev LLMs TXT project.

```APIDOC
## openDevtools

### Description
Controls whether the browser developer tools should be opened automatically.

### Method
N/A (Configuration Option)

### Endpoint
N/A

### Parameters
#### Query Parameters
- **openDevtools** (boolean) - Optional - If true, opens the browser developer tools.

### Request Example
```json
{
  "openDevtools": true
}
```

### Response
#### Success Response (200)
N/A

#### Response Example
N/A

## startUrls

### Description
Specifies the URLs that the browser should navigate to when it starts.

### Method
N/A (Configuration Option)

### Endpoint
N/A

### Parameters
#### Query Parameters
- **startUrls** (string[]) - Optional - An array of URLs to open on startup.

### Request Example
```json
{
  "startUrls": ["https://example.com", "https://another.com"]
}
```

### Response
#### Success Response (200)
N/A

#### Response Example
N/A
```

--------------------------------

### Add build-time configuration

Source: https://wxt.dev/guide/essentials/wxt-modules

Define custom module options and augment WXT types for build-time configuration.

```ts
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

### Get WXT Version

Source: https://wxt.dev/api/reference/wxt/variables/version

Retrieves the current version of the WXT library.

```APIDOC
## GET /api/reference/wxt/variables/version.md

### Description
This endpoint provides the current version of the WXT library.

### Method
GET

### Endpoint
/api/reference/wxt/variables/version.md

### Response
#### Success Response (200)
- **version** (string) - The current version string of WXT.

#### Response Example
```json
{
  "version": "1.2.3"
}
```
```

--------------------------------

### Build extension using build()

Source: https://wxt.dev/api/reference/wxt/functions/build

Use the build() function to bundle your extension. You can either use the default configuration from `wxt.config.ts` or override it with an inline configuration object.

```typescript
import { build } from 'wxt';

// Use config from `wxt.config.ts`
const res = await build();

// or override config `from wxt.config.ts`
const res = await build({
  // Override config...
});
```

--------------------------------

### Storage API - Get Metas

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/WxtStorage

Retrieves metadata for multiple storage items.

```APIDOC
## GET /storage/metas

### Description
Retrieves metadata for a list of storage items.

### Method
GET

### Endpoint
/storage/metas

### Query Parameters
- **keys** (string[]) - Required - An array of storage keys for which to retrieve metadata.

### Response
#### Success Response (200)
- **metadatas** (object[]) - An array of objects, where each object contains a 'key' and its corresponding 'metadata'.

### Response Example
```json
{
  "metadatas": [
    { "key": "local:installDate", "metadata": { "appVersion": "1.0.0" } },
    { "key": "session:someCounter", "metadata": {} }
  ]
}
```
```

--------------------------------

### Storage API - Get Meta

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/WxtStorage

Retrieves metadata associated with a specific storage key.

```APIDOC
## GET /storage/meta/{key}

### Description
Retrieves metadata associated with a specific storage key. If the value is not an object, an empty object is returned.

### Method
GET

### Endpoint
/storage/meta/{key}

### Parameters
#### Path Parameters
- **key** (string) - Required - The storage key to retrieve metadata for. Can be prefixed with 'local:', 'session:', 'sync:', or 'managed:'.

### Response
#### Success Response (200)
- **metadata** (object) - An object containing the metadata for the specified key.

### Response Example
```json
{
  "metadata": {
    "appVersion": "1.0.0"
  }
}
```
```

--------------------------------

### Define Substitutions

Source: https://wxt.dev/i18n

Use $1-$9 placeholders for dynamic content.

```yml
hello: Hello $1!
order: Thanks for ordering your $1
```

--------------------------------

### Build Firefox Extension ZIP

Source: https://wxt.dev/guide/essentials/publishing

Commands to install dependencies and generate a Firefox-compatible source ZIP.

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

### WXT Configuration Options

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Overview of the available configuration properties for WXT projects.

```APIDOC
## WXT Configuration Properties

### Description
These properties define the behavior of the WXT build system, including directory structures, module inclusion, and browser-specific settings.

### Configuration Fields
- **modules** (string[]) - Optional - List of WXT module names to include.
- **modulesDir** (string) - Optional - Directory for WXT modules. Default: '${config.root}/modules'.
- **outDir** (string) - Optional - Output directory for build folders and ZIPs. Default: '.output'.
- **outDirTemplate** (string) - Optional - Template string for customizing the output directory structure.
- **publicDir** (string) - Optional - Directory containing files to be copied to the output. Default: '${config.root}/public'.
- **root** (string) - Optional - Project root directory. Default: process.cwd().
- **srcDir** (string) - Optional - Directory containing all source code. Default: config.root.
- **suppressWarnings** (object) - Optional - Configuration to suppress specific build warnings.
- **targetBrowsers** (string[]) - Optional - List of target browsers to support.
- **vite** (function) - Optional - Function returning custom Vite options.
- **webExt** (object) - Optional - Configuration for browser startup (formerly runner).
```

--------------------------------

### Exclude files from ZIP

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Example of using Picomatch patterns to exclude files from the extension ZIP.

```ts
[
    '**/*.map', // Exclude all sourcemaps
  ];
```

--------------------------------

### WXT Directory Paths

Source: https://wxt.dev/api/reference/wxt/interfaces/ResolvedConfig

Defines the absolute paths for the .wxt directory and the installed wxt module directory.

```APIDOC
## wxtDir

### Description
Absolute path pointing to `.wxt` directory in project root.

### Type
`string`

### Example
```ts
'/path/to/project/.wxt';
```

## wxtModuleDir

### Description
Absolute path pointing to the `node_modules/wxt` directory, wherever WXT is installed.

### Type
`string`
```

--------------------------------

### Register an entrypoint in a WXT module

Source: https://wxt.dev/api/reference/wxt/modules/functions/addEntrypoint

Demonstrates how to add a content script entrypoint within a WXT module, utilizing wxt.builder.importEntrypoint to extract configuration options.

```ts
export default defineWxtModule(async (wxt, options) => {
    const entrypointPath = '/path/to/my-entrypoint.ts';
    addEntrypoint(wxt, {
      type: 'content-script',
      name: 'some-name',
      inputPath: entrypointPath,
      outputDir: wxt.config.outDir,
      options: await wxt.builder.importEntrypoint(entrypointPath),
    });
  });
```

--------------------------------

### BackgroundDefinition: main() method

Source: https://wxt.dev/api/reference/wxt/interfaces/BackgroundDefinition

The 'main()' method is the primary function executed when the background script starts. It cannot be asynchronous.

```typescript
main(): void
```

--------------------------------

### wxt/utils/storage Module Overview

Source: https://wxt.dev/api/reference/wxt/utils/storage

This section provides an overview of the wxt/utils/storage module, including its exported components.

```APIDOC
## Module: wxt/utils/storage

Re-export the [`@wxt-dev/storage` package](https://www.npmjs.com/package/@wxt-dev/storage).

### Classes

* [MigrationError](classes/MigrationError.md)

### Interfaces

* [GetItemOptions](interfaces/GetItemOptions.md)
* [RemoveItemOptions](interfaces/RemoveItemOptions.md)
* [SnapshotOptions](interfaces/SnapshotOptions.md)
* [WxtStorage](interfaces/WxtStorage.md)
* [WxtStorageItem](interfaces/WxtStorageItem.md)
* [WxtStorageItemOptions](interfaces/WxtStorageItemOptions.md)

### Type Aliases

* [StorageArea](type-aliases/StorageArea.md)
* [StorageAreaChanges](type-aliases/StorageAreaChanges.md)
* [StorageItemKey](type-aliases/StorageItemKey.md)
* [Unwatch](type-aliases/Unwatch.md)
* [WatchCallback](type-aliases/WatchCallback.md)

### Variables

* [storage](variables/storage.md)
```

--------------------------------

### Exclude files from sources ZIP

Source: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig

Example of using Picomatch patterns to exclude files from the sources ZIP.

```ts
[
    'coverage', // Ignore the coverage directory in the `sourcesRoot`
  ];
```

--------------------------------

### Use vite-node Entrypoint Loader with Imports

Source: https://wxt.dev/guide/resources/upgrading

Demonstrates importing variables and using Vite-specific APIs like `import.meta.glob` in entrypoint options when using `vite-node`.

```typescript
import { GOOGLE_MATCHES } from '~/utils/constants'

export default defineContentScript({
  matches: [GOOGLE_MATCHES],
  main: () => ...
})
```

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

### Correcting Entrypoint Structure (HTML)

Source: https://wxt.dev/guide/essentials/entrypoints

Highlights a common mistake of placing files related to an entrypoint directly in the `entrypoints/` directory and shows the corrected approach using a dedicated subdirectory. Files marked with `[!code --]` should be removed, and `[!code ++]` files should be added.

```html
📂 entrypoints/
   📄 popup.html <!-- [!code --] -->
   📄 popup.ts <!-- [!code --] -->
   📄 popup.css <!-- [!code --] -->
   📂 popup/ <!-- [!code ++] -->
      📄 index.html <!-- [!code ++] -->
      📄 main.ts <!-- [!code ++] -->
      📄 style.css <!-- [!code ++] -->
```

--------------------------------

### WebExtConfig Interface Properties

Source: https://wxt.dev/api/reference/wxt/interfaces/WebExtConfig

This section details the properties of the WebExtConfig interface, which are used to configure how web-ext starts the browser.

```APIDOC
## Interface: WebExtConfig

Options for how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser.

### Properties

#### binaries

> **binaries**?: `Record`<`string`, `string`>

List of browser names and the binary that should be used to open the browser.

#### chromiumArgs

> **chromiumArgs**?: `string`[]

#### chromiumPort

> **chromiumPort**?: `number`

By default, chrome opens a random port for debugging. Set this value to use a specific port.

#### chromiumPref

> **chromiumPref**?: `Record`<`string`, `any`>

An map of chrome preferences from https://chromium.googlesource.com/chromium/src/+/main/chrome/common/pref_names.h

##### Example
```ts
// change your downloads directory
  {
  download: {
  default_directory: "/my/custom/dir",
  },
  }
```

##### Default
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

#### disabled

> **disabled**?: `boolean`

Whether or not to open the browser with the extension installed in dev mode.

##### Default
```ts
false
```

#### firefoxArgs

> **firefoxArgs**?: `string`[]

#### firefoxPref

> **firefoxPref**?: `Record`<`string`, `string` | `number` | `boolean`>

#### firefoxProfile

> **firefoxProfile**?: `string`

#### keepProfileChanges

> **keepProfileChanges**?: `boolean`

#### openConsole

> **openConsole**?: `boolean`

```

--------------------------------

### BackgroundEntrypointOptions Interface

Source: https://wxt.dev/api/reference/wxt/interfaces/BackgroundEntrypointOptions

Configuration options for defining background entrypoints in WXT.

```APIDOC
## BackgroundEntrypointOptions

### Description
Configuration interface for background entrypoints, allowing control over browser targeting, persistence, and module bundling.

### Properties
- **exclude** (string[]) - Optional - List of target browsers to exclude this entrypoint from. Cannot be used with `include`.
- **include** (string[]) - Optional - List of target browsers to include this entrypoint in. Defaults to all. Cannot be used with `exclude`.
- **persistent** (PerBrowserOption<boolean>) - Optional - Configuration for background script persistence.
- **type** (PerBrowserOption<"module">) - Optional - Set to "module" to output the background entrypoint as ESM for better chunk sharing.
```

--------------------------------

### WxtModule Interface Definition

Source: https://wxt.dev/api/reference/wxt/interfaces/WxtModule

Details the properties available for defining a WxtModule, including configuration keys, hooks, and setup functions.

```APIDOC
## WxtModule Interface

### Description
The WxtModule interface defines the structure for modules in WXT. It allows for the registration of auto-imports, lifecycle hooks, and custom setup logic.

### Properties
- **configKey** (string) - Optional - Key for users to pass options into your module from their wxt.config.ts file.
- **hooks** (NestedHooks<WxtHooks>) - Optional - Alternative to adding hooks in setup function with wxt.hooks. Hooks are added before the setup function is called.
- **imports** (Import[]) - Optional - Provide a list of imports to add to auto-imports.
- **name** (string) - Optional - The name of the module.
- **setup** (WxtModuleSetup<TOptions>) - Optional - A custom function that can be used to setup hooks and call module-specific APIs.
```

--------------------------------

### Function: zip()

Source: https://wxt.dev/api/reference/wxt/functions/zip

Builds and zips the extension for distribution, returning a list of files included in the resulting ZIP archive.

```APIDOC
## Function: zip()

### Description
Build and zip the extension for distribution.

### Parameters
#### Path Parameters
- **config** (InlineConfig) - Optional - Optional config that will override your <root>/wxt.config.ts.

### Returns
- **Promise<string[]>** - A list of all files included in the ZIP.
```

--------------------------------

### createIframeUi()

Source: https://wxt.dev/api/reference/wxt/utils/content-script-ui/iframe/functions/createIframeUi

Initializes a content script UI using an iframe.

```APIDOC
## Function: createIframeUi()

### Description
Creates a content script UI using an iframe. This utility is designed to help manage UI components injected into the DOM via iframes within WXT content scripts.

### Parameters
#### Arguments
- **ctx** (ContentScriptContext) - Required - The content script context instance.
- **options** (IframeContentScriptUiOptions<TMounted>) - Required - Configuration options for the iframe UI.

### Returns
- **IframeContentScriptUi<TMounted>** - An object representing the mounted iframe UI.

### See
[WXT Content Scripts Guide](https://wxt.dev/guide/essentials/content-scripts.html#iframe)
```