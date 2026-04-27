### Run WXT Development Server with NPM

Source: https://wxt.dev/guide/installation.html

Starts the WXT development server using NPM. WXT will automatically open a browser with the extension installed.

```sh
npm run dev
```

--------------------------------

### Run WXT Development Server with Bun

Source: https://wxt.dev/guide/installation.html

Starts the WXT development server using Bun. WXT will automatically open a browser with the extension installed.

```sh
bun run dev
```

--------------------------------

### Run WXT Development Server with Yarn

Source: https://wxt.dev/guide/installation.html

Starts the WXT development server using Yarn. WXT will automatically open a browser with the extension installed.

```sh
yarn dev
```

--------------------------------

### Run WXT Development Server with PNPM

Source: https://wxt.dev/guide/installation.html

Starts the WXT development server using PNPM. WXT will automatically open a browser with the extension installed.

```sh
pnpm dev
```

--------------------------------

### Install Polyfill Packages

Source: https://wxt.dev/guide/resources/upgrading

If you choose to continue using the webextension-polyfill, install `webextension-polyfill` and WXT's new polyfill module.

```sh
pnpm i webextension-polyfill @wxt-dev/webextension-polyfill
```

--------------------------------

### Define Background Entrypoint

Source: https://wxt.dev/guide/essentials/entrypoints

Example structure for a background script entrypoint.

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

### MV3 Manifest Example

Source: https://wxt.dev/guide/essentials/config/manifest

Example of how WXT generates a Manifest V3 JSON file, including `action` and `web_accessible_resources`.

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

### Run WXT Prepare

Source: https://wxt.dev/guide/resources/upgrading

Execute this command after installing the latest WXT version and addressing any breaking changes to prepare your project.

```sh
pnpm wxt prepare
```

--------------------------------

### Install WXT Latest Ignoring Scripts

Source: https://wxt.dev/guide/resources/upgrading

Use this command to install the latest WXT version while skipping scripts, which is recommended before running `wxt prepare` after a major version upgrade.

```sh
pnpm i wxt@latest --ignore-scripts
```

--------------------------------

### MV2 Manifest Example

Source: https://wxt.dev/guide/essentials/config/manifest

Example of how WXT generates a Manifest V2 JSON file, including `browser_action` and `web_accessible_resources`.

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

### Generated Manifest Version Example

Source: https://wxt.dev/guide/essentials/config/manifest

Shows the resulting `version` and `version_name` in the `manifest.json` based on the `package.json` version.

```json
// .output/<target>/manifest.json
{
  "version": "1.3.0",
  "version_name": "1.3.0-alpha2"
}
```

--------------------------------

### Bootstrap WXT Project with NPM (Yarn Prompt)

Source: https://wxt.dev/guide/installation.html

Initiates a new WXT project using NPM, but prompts the user to select Yarn during the setup process.

```sh
# Use NPM initially, but select Yarn when prompted
npx wxt@latest init
```

--------------------------------

### Create Shadow Root UI with Frameworks

Source: https://wxt.dev/guide/essentials/content-scripts

Examples of implementing isolated UIs in content scripts using various frontend frameworks.

```ts
// 1. Import the style
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount(container) {
        // Define how your UI will be mounted inside the container
        const app = document.createElement('p');
        app.textContent = 'Hello world!';
        container.append(app);
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```ts
// 1. Import the style
import './style.css';
import { createApp } from 'vue';
import App from './App.vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Define how your UI will be mounted inside the container
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```tsx
// 1. Import the style
import './style.css';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Container is a body, and React warns when creating a root on the body, so create a wrapper div
        const app = document.createElement('div');
        container.append(app);

        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

```ts
// 1. Import the style
import './style.css';
import App from './App.svelte';
import { mount, unmount } from 'svelte';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
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

    // 4. Mount the UI
    ui.mount();
  },
});
```

```tsx
// 1. Import the style
import './style.css';
import { render } from 'solid-js/web';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // Render your app to the UI container
        const unmount = render(() => <div>...</div>, container);
      },
      onRemove: (unmount) => {
        // Unmount the app when the UI is removed
        unmount?.();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
```

--------------------------------

### Define WXT Background Entrypoint

Source: https://wxt.dev/guide/installation.html

Example of defining a background script entrypoint for WXT. This script logs 'Hello world!' when it initializes.

```ts
export default defineBackground(() => {
  console.log('Hello world!');
});
```

--------------------------------

### Package JSON Version Example

Source: https://wxt.dev/guide/essentials/config/manifest

Illustrates how the `version` and `version_name` in the generated manifest.json are derived from the `version` field in `package.json`.

```json
// package.json
{
  "version": "1.3.0-alpha2"
}
```

--------------------------------

### Rebuild Firefox Extension from Sources

Source: https://wxt.dev/guide/essentials/publishing

Commands to install dependencies and rebuild the extension from the provided source ZIP.

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
bun i
bun zip:firefox
```

--------------------------------

### Import Using Custom Aliases

Source: https://wxt.dev/guide/essentials/config/typescript

Example of importing modules using the custom aliases defined in the WXT configuration.

```ts
import { fakeTab } from 'testing/fake-objects';
import { toLowerCase } from 'strings';
```

--------------------------------

### Install WXT as Dev Dependency with Bun

Source: https://wxt.dev/guide/installation.html

Add WXT to your project's development dependencies using Bun.

```sh
bun i -D wxt
```

--------------------------------

### Install WXT as Dev Dependency with PNPM

Source: https://wxt.dev/guide/installation.html

Add WXT to your project's development dependencies using PNPM.

```sh
pnpm i -D wxt
```

--------------------------------

### Install WXT as Dev Dependency with NPM

Source: https://wxt.dev/guide/installation.html

Add WXT to your project's development dependencies using NPM.

```sh
npm i -D wxt
```

--------------------------------

### Add `wxt prepare` to `postinstall` script

Source: https://wxt.dev/guide/essentials/config/auto-imports

Ensure your editor recognizes auto-imported variables by adding `wxt prepare` to your `postinstall` script in `package.json`. This command is crucial for TypeScript and editor type checking after dependency installation.

```json
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare", // [!code ++]
  },
}
```

--------------------------------

### Configure Solid Module

Source: https://wxt.dev/guide/essentials/frontend-frameworks

Add the Solid module to your WXT configuration to enable Solid support. This simplifies setup and adds auto-imports.

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
});
```

--------------------------------

### Example Vitest Tests for WXT

Source: https://wxt.dev/guide/essentials/unit-testing

Demonstrates writing unit tests for WXT extensions using Vitest. It shows how to test functionality that relies on browser storage without explicit mocking, thanks to `@webext-core/fake-browser`.

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

### Install WXT as Dev Dependency with Yarn

Source: https://wxt.dev/guide/installation.html

Add WXT to your project's development dependencies using Yarn.

```sh
yarn add --dev wxt
```

--------------------------------

### Basic WXT Module Structure

Source: https://wxt.dev/guide/essentials/wxt-modules

A fundamental WXT module is defined using 'defineWxtModule'. The 'setup' function receives the 'wxt' object for interacting with the build process.

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    // Your module code here...
  },
});
```

--------------------------------

### Add Build-Time Config to WXT Module

Source: https://wxt.dev/guide/essentials/wxt-modules

Define build-time options for a module by extending WXT's InlineConfig and specifying a 'configKey'. Options are passed to the setup function.

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

### Install WXT Latest (Minor/Patch Update)

Source: https://wxt.dev/guide/resources/upgrading

For minor or patch version updates, simply use your package manager to update WXT to the latest version.

```sh
pnpm i wxt@latest
```

--------------------------------

### Configure React Module

Source: https://wxt.dev/guide/essentials/frontend-frameworks

Add the React module to your WXT configuration to enable React support. This simplifies setup and adds auto-imports.

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
});
```

--------------------------------

### Add Vite plugins to WXT

Source: https://wxt.dev/guide/essentials/config/vite

Install the desired NPM package and include it in the plugins array within the vite configuration function.

```ts
import { defineConfig } from 'wxt';
import VueRouter from 'unplugin-vue-router/vite';

export default defineConfig({
  vite: () => ({
    plugins: [
      VueRouter({
        /* ... */
      }),
    ],
  }),
});
```

--------------------------------

### GitHub Actions workflow for releasing extensions

Source: https://wxt.dev/guide/essentials/publishing

This GitHub Actions workflow automates the process of checking out code, setting up pnpm, installing dependencies, zipping extensions for Chrome and Firefox, and submitting them to the respective stores using environment variables for authentication.

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Zip extensions
        run: |
          pnpm zip
          pnpm zip:firefox

      - name: Submit to stores
        run: |
          pnpm wxt submit \
            --chrome-zip .output/*-chrome.zip \
            --firefox-zip .output/*-firefox.zip --firefox-sources-zip .output/*-sources.zip
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          FIREFOX_EXTENSION_ID: ${{ secrets.FIREFOX_EXTENSION_ID }}
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
```

--------------------------------

### Configure Vue Module

Source: https://wxt.dev/guide/essentials/frontend-frameworks

Add the Vue module to your WXT configuration to enable Vue support. This simplifies setup and adds auto-imports.

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
});
```

--------------------------------

### Configure Svelte Module

Source: https://wxt.dev/guide/essentials/frontend-frameworks

Add the Svelte module to your WXT configuration to enable Svelte support. This simplifies setup and adds auto-imports.

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
});
```

--------------------------------

### Set Custom Browser Binaries

Source: https://wxt.dev/guide/essentials/config/browser-startup

Specify custom paths or names for browser executables in `web-ext.config.ts` or `wxt.config.ts`. This allows using specific browser versions or non-standard installations.

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    chrome: '/path/to/chrome-beta',
    firefox: 'firefoxdeveloperedition',
    edge: '/path/to/edge',
  },
});
```

```typescript
export default defineConfig({
  webExt: {
    binaries: {
      chrome: '/path/to/chrome-beta',
      firefox: 'firefoxdeveloperedition',
      edge: '/path/to/edge',
    },
  },
});
```

--------------------------------

### Initialize New Project Directory with Bun

Source: https://wxt.dev/guide/installation.html

Navigate to your project directory and initialize a new project using Bun.

```sh
cd my-project
bun init
```

--------------------------------

### Initialize New Project Directory with NPM

Source: https://wxt.dev/guide/installation.html

Navigate to your project directory and initialize a new project using NPM.

```sh
cd my-project
npm init
```

--------------------------------

### Bootstrap WXT Project with NPM

Source: https://wxt.dev/guide/installation.html

Use this command to initialize a new WXT project with NPM. Follow the on-screen prompts for configuration.

```sh
npx wxt@latest init
```

--------------------------------

### Bootstrap WXT Project with Bun

Source: https://wxt.dev/guide/installation.html

Use this command to initialize a new WXT project with Bun. Follow the on-screen prompts for configuration.

```sh
bunx wxt@latest init
```

--------------------------------

### Bootstrap WXT Project with PNPM

Source: https://wxt.dev/guide/installation.html

Use this command to initialize a new WXT project with PNPM. Follow the on-screen prompts for configuration.

```sh
pnpm dlx wxt@latest init
```

--------------------------------

### Initialize New Project Directory with PNPM

Source: https://wxt.dev/guide/installation.html

Navigate to your project directory and initialize a new project using PNPM.

```sh
cd my-project
pnpm init
```

--------------------------------

### Initialize a new WXT project

Source: https://wxt.dev/guide/resources/migrate

Use this command to create a new vanilla WXT project for reference during the migration process.

```sh
cd path/to/your/project
pnpm dlx wxt@latest init example-wxt --template vanilla
```

--------------------------------

### Initialize New Project Directory with Yarn

Source: https://wxt.dev/guide/installation.html

Navigate to your project directory and initialize a new project using Yarn.

```sh
cd my-project
yarn init
```

--------------------------------

### Add NPM Module to wxt.config.ts

Source: https://wxt.dev/guide/essentials/wxt-modules

Install an NPM package and add its name to the 'modules' array in your wxt.config.ts file.

```typescript
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
});
```

--------------------------------

### Correct Entrypoint Directory Usage

Source: https://wxt.dev/guide/essentials/entrypoints

Avoid placing related files directly in the entrypoints/ directory; use subdirectories instead.

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

### Configure HTML Entrypoint Manifest Options

Source: https://wxt.dev/guide/essentials/entrypoints

Use meta tags within HTML entrypoints to configure manifest settings.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta name="manifest.type" content="page_action" />
  </head>
</html>
```

--------------------------------

### Configure Options Entrypoint

Source: https://wxt.dev/guide/essentials/entrypoints

Define options page behavior using meta tags to control tab opening and styling preferences.

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

### Define Entrypoint Structure

Source: https://wxt.dev/guide/essentials/entrypoints

Entrypoints can be defined as a single file or a directory containing an index file.

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

### Unlisted CSS Example

Source: https://wxt.dev/guide/essentials/entrypoints

CSS files are always unlisted by default. To include CSS in a content script, refer to the Content Script documentation.

```css
body {
  /* ... */
}
```

--------------------------------

### View hook execution order

Source: https://wxt.dev/guide/essentials/config/hooks

Run the prepare command with the debug flag to inspect the sequence in which hooks are executed.

```plaintext
⚙ Hook execution order:
⚙   1. wxt:built-in:unimport
⚙   2. src/modules/auto-icons.ts
⚙   3. src/modules/example.ts
⚙   4. src/modules/i18n.ts
⚙   5. wxt.config.ts > hooks
```

--------------------------------

### Get Translation using browser.i18n

Source: https://wxt.dev/guide/essentials/i18n

Retrieve translated strings in your code using `browser.i18n.getMessage()`. Ensure the message key exists in your `messages.json` files.

```typescript
browser.i18n.getMessage('helloWorld');
```

--------------------------------

### Configure Popup Entrypoint

Source: https://wxt.dev/guide/essentials/entrypoints

Customize action button behavior, icons, and Firefox-specific theme settings using meta tags.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Set the `action.default_title` in the manifest -->
    <title>Default Popup Title</title>

    <!-- Customize the manifest options -->
    <meta
      name="manifest.default_icon"
      content="{
        16: '/icon-16.png',
        24: '/icon-24.png',
        ...
      }"
    />
    <meta name="manifest.type" content="page_action|browser_action" />
    <meta name="manifest.browser_style" content="true|false" />
    <!-- Firefox only: where to place the action button -->
    <meta
      name="manifest.default_area"
      content="navbar|menupanel|tabstrip|personaltoolbar"
    />
    <!-- Firefox only: icons for light/dark themes -->
    <meta
      name="manifest.theme_icons"
      content="[
        { light: '/icon-light-16.png', dark: '/icon-dark-16.png', size: 16 },
        { light: '/icon-light-32.png', dark: '/icon-dark-32.png', size: 32 }
      ]"
    />

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

### Accessing Built-in WXT Environment Variables

Source: https://wxt.dev/guide/essentials/config/environment-variables

Utilize WXT's custom environment variables such as MANIFEST_VERSION and BROWSER to get information about the current build and target browser.

```typescript
import.meta.env.MANIFEST_VERSION
```

```typescript
import.meta.env.BROWSER
```

```typescript
import.meta.env.CHROME
```

```typescript
import.meta.env.FIREFOX
```

```typescript
import.meta.env.SAFARI
```

```typescript
import.meta.env.EDGE
```

```typescript
import.meta.env.OPERA
```

--------------------------------

### Define Entrypoints for injectScript

Source: https://wxt.dev/guide/essentials/content-scripts

File structure required for using injectScript with an unlisted script.

```html
📂 entrypoints/
   📄 example.content.ts
   📄 example-main-world.ts
```

--------------------------------

### Update Resolved Config in WXT Module

Source: https://wxt.dev/guide/essentials/wxt-modules

Use the 'config:resolved' hook within a module's setup to modify WXT's configuration, such as changing the output directory.

```typescript
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    wxt.hook('config:resolved', () => {
      wxt.config.outDir = 'dist';
    });
  },
});
```

--------------------------------

### Get Registered Content Scripts - JavaScript

Source: https://wxt.dev/guide/resources/faq

Run this command in the service worker's console during development to list dynamically registered content scripts. This helps in debugging content script loading.

```javascript
await chrome.scripting.getRegisteredContentScripts();
```

--------------------------------

### Augmenting Browser Types for Firefox APIs

Source: https://wxt.dev/guide/essentials/extension-apis

Extend WXT's `Browser` types to include Firefox-specific APIs like `sidebarAction` by augmenting the `@wxt-dev/browser` module. Ensure `@wxt-dev/browser` is installed as a direct dependency.

```typescript
// <srcDir>/browser-types.d.ts
import '@wxt-dev/browser';
import type { SidebarAction } from 'webextension-polyfill';

declare module '@wxt-dev/browser' {
  namespace Browser {
    export const sidebarAction: SidebarAction.Static;
  }
}
```

--------------------------------

### Use Vite's import.meta.glob in Content Script Entrypoints

Source: https://wxt.dev/guide/resources/upgrading

Demonstrates using `import.meta.glob` within a content script entrypoint to dynamically import modules and define script matches.

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

### Generate ZIP archives for publishing

Source: https://wxt.dev/guide/essentials/publishing

Use `wxt zip` to create ZIP archives for your extension. Specify the target browser with the `-b` flag. For example, `wxt zip -b firefox` creates a Firefox-compatible ZIP.

```sh
wxt zip
wxt zip -b firefox
```

--------------------------------

### Build and Convert for Safari

Source: https://wxt.dev/guide/essentials/publishing

Builds the extension for Safari and uses the Xcode command-line tool for conversion.

```sh
pnpm wxt build -b safari
xcrun safari-web-extension-converter .output/safari-mv2
```

--------------------------------

### Persist Browser Data on Mac/Linux

Source: https://wxt.dev/guide/essentials/config/browser-startup

Configure `chromiumArgs` in `web-ext.config.ts` to use a persistent user data directory for Chromium-based browsers on Mac/Linux. This allows data like logins and installed extensions to be retained across development sessions.

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});
```

--------------------------------

### Configure Content Script Manifest Options

Source: https://wxt.dev/guide/essentials/entrypoints

Define manifest options directly within the entrypoint file using defineContentScript.

```ts
export default defineContentScript({
  matches: ['*://*.wxt.dev/*'],
  main() {
    // ...
  },
});
```

--------------------------------

### Enable src Directory

Source: https://wxt.dev/guide/essentials/project-structure

Configuration to move source files into a dedicated src directory.

```ts
export default defineConfig({
  srcDir: 'src',
});
```

--------------------------------

### Specify build modes via CLI

Source: https://wxt.dev/guide/essentials/config/build-mode

Pass the --mode flag to WXT commands to define the environment for development, production, or custom testing scenarios.

```sh
wxt --mode production
wxt build --mode development
wxt zip --mode testing
```

--------------------------------

### Target Browsers via CLI

Source: https://wxt.dev/guide/essentials/target-different-browsers

Use the -b flag to specify the target browser during the build process.

```sh
wxt            # same as: wxt -b chrome
wxt -b firefox
wxt -b custom
```

--------------------------------

### Dry run submission to stores

Source: https://wxt.dev/guide/essentials/publishing

Before a real submission, use `wxt submit --dry-run` with the appropriate zip file paths to test your configuration and secrets. This command simulates the submission process without actually sending the extension.

```sh
wxt submit --dry-run \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

--------------------------------

### Submit extension versions to stores

Source: https://wxt.dev/guide/essentials/publishing

After a successful dry run, execute `wxt submit` with the paths to your generated ZIP files to submit new versions of your extension to the Chrome Web Store, Edge Addons, and Firefox Addons Store.

```sh
wxt submit \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

--------------------------------

### Define a Content Script Entrypoint

Source: https://wxt.dev/guide/essentials/content-scripts

Use `defineContentScript` to create a content script entrypoint. The `main` function receives a context object for managing script lifecycle.

```typescript
export default defineContentScript({
  main(ctx) {},
});
```

--------------------------------

### Project Structure with src Directory

Source: https://wxt.dev/guide/essentials/project-structure

The resulting directory layout after enabling the src directory configuration.

```html
📂 {rootDir}/
   📁 .output/
   📁 .wxt/
   📁 modules/
   📁 public/
   📂 src/
      📁 assets/
      📁 components/
      📁 composables/
      📁 entrypoints/
      📁 hooks/
      📁 utils/
      📄 app.config.ts
   📄 .env
   📄 .env.publish
   📄 package.json
   📄 tsconfig.json
   📄 web-ext.config.ts
   📄 wxt.config.ts
```

--------------------------------

### WXT Package.json Scripts Configuration

Source: https://wxt.dev/guide/installation.html

Essential scripts for managing WXT projects, including development, building, zipping, and preparation steps. Supports both default and Firefox builds.

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

### Enable Main World via Content Script Option

Source: https://wxt.dev/guide/essentials/content-scripts

Configures a content script to run in the main world using the 'world' option.

```ts
export default defineContentScript({
  world: 'MAIN',
});
```

--------------------------------

### Browser API Implementation

Source: https://wxt.dev/guide/essentials/extension-apis

This code shows how WXT's `browser` variable is implemented by selecting either `globalThis.browser` or `globalThis.chrome`.

```mjs
export const browser = globalThis.browser?.runtime?.id
  ? globalThis.browser
  : globalThis.chrome;
```

--------------------------------

### Revert to JITI Entrypoint Loader

Source: https://wxt.dev/guide/resources/upgrading

Configure `wxt.config.ts` to use the `jiti` entrypoint loader to maintain the old entrypoint loading behavior. Note: this option is deprecated.

```typescript
export default defineConfig({
  entrypointLoader: 'jiti',
});
```

--------------------------------

### Configure Sandbox Entrypoint

Source: https://wxt.dev/guide/essentials/entrypoints

Define a sandboxed page for Chromium-based browsers. Note that this is not supported in Firefox.

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

### Module file naming convention

Source: https://wxt.dev/guide/essentials/config/hooks

Prefix module filenames with numbers to control the execution order, where lower numbers load first.

```html
📁 modules/
   📄 0.my-module.ts
   📄 1.another-module.ts
```

--------------------------------

### Default WXT Project Structure

Source: https://wxt.dev/guide/essentials/project-structure

The standard flat directory layout used by WXT projects by default.

```html
📂 {rootDir}/
   📁 .output/
   📁 .wxt/
   📁 assets/
   📁 components/
   📁 composables/
   📁 entrypoints/
   📁 hooks/
   📁 modules/
   📁 public/
   📁 utils/
   📄 .env
   📄 .env.publish
   📄 app.config.ts
   📄 package.json
   📄 tsconfig.json
   📄 web-ext.config.ts
   📄 wxt.config.ts
```

--------------------------------

### Mocking WXT APIs in Vitest

Source: https://wxt.dev/guide/essentials/unit-testing

Illustrates how to mock WXT-specific APIs when using Vitest. It explains that you should mock the actual import path (e.g., 'wxt/utils/inject-script') rather than the '#imports' alias.

```typescript
vi.mock("wxt/utils/inject-script", () => ({
  injectScript: ...
}))
```

--------------------------------

### Enable Prompt API in Chrome with Chromium Args

Source: https://wxt.dev/guide/resources/faq

To enable the Chrome Prompt API when WXT automatically opens the browser, pass the `--disable-features=DisableLoadExtensionCommandLineSwitch` argument in your `wxt.config.ts`. This ensures the service is available.

```typescript
export default defineConfig({
  webExt: {
    chromiumArgs: [
      '--disable-features=DisableLoadExtensionCommandLineSwitch',
    ],
  },
});
```

--------------------------------

### Localize Extension Name and Description

Source: https://wxt.dev/guide/essentials/i18n

Use `__MSG_messageName__` placeholders in the manifest for the extension's name and description to enable localization. Ensure corresponding messages are defined in your `messages.json` files.

```json
{
  "extName": {
    "message": "..."
  },
  "extDescription": {
    "message": "..."
  },
  "helloWorld": {
    "message": "Hello world!"
  }
}
```

--------------------------------

### Configure WXT Polyfill Module

Source: https://wxt.dev/guide/resources/upgrading

Add the WXT polyfill module to your `wxt.config.ts` file to enable its usage.

```typescript
export default defineConfig({
  modules: ['@wxt-dev/webextension-polyfill'],
});
```

--------------------------------

### Enable ESLint auto-imports configuration (v8)

Source: https://wxt.dev/guide/essentials/config/auto-imports

Enable WXT to generate an ESLint v8 auto-imports configuration. This allows ESLint to recognize auto-imported variables.

```typescript
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 8,
    },
  },
});
```

--------------------------------

### Include Private Packages in ZIP

Source: https://wxt.dev/guide/essentials/publishing

Configures WXT to download and include private packages in the source ZIP for Firefox review.

```ts
export default defineConfig({
  zip: {
    downloadPackages: [
      '@mycompany/some-package',
      //...
    ],
  },
});
```

--------------------------------

### Configure History and Newtab Entrypoints

Source: https://wxt.dev/guide/essentials/entrypoints

Use these HTML templates to override the browser's history or new tab page. WXT automatically updates the manifest upon detection.

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

### Define Web Extension Configuration

Source: https://wxt.dev/guide/essentials/config/browser-startup

Use `defineWebExtConfig` to configure WXT settings in `web-ext.config.ts`. This file is ignored by version control.

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // ...
});
```

--------------------------------

### Copy WASM file to output with WXT module

Source: https://wxt.dev/guide/essentials/assets

Use a WXT module to hook into the build process and copy the WASM file to the output directory.

```ts
// modules/oxc-parser-wasm.ts
import { resolve } from 'node:path';

export default defineWxtModule((wxt) => {
  wxt.hook('build:publicAssets', (_, assets) => {
    assets.push({
      absoluteSrc: resolve(
        'node_modules/@oxc-parser/wasm/web/oxc_parser_wasm_bg.wasm',
      ),
      relativeDest: 'oxc_parser_wasm_bg.wasm',
    });
  });
});
```

--------------------------------

### Configure Vitest with WXT Plugin

Source: https://wxt.dev/guide/essentials/unit-testing

Set up your Vitest configuration file to include the WXT Vitest plugin. This plugin automatically configures Vitest for WXT projects, polyfilling browser APIs and applying necessary Vite configurations.

```typescript
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

--------------------------------

### Configure Default Output Directory Template

Source: https://wxt.dev/guide/resources/upgrading

Set the `outDirTemplate` option to maintain the old behavior of writing all output to a single directory.

```typescript
export default defineConfig({
  outDirTemplate: '{{browser}}-mv{{manifestVersion}}',
});
```

--------------------------------

### Access build mode at runtime

Source: https://wxt.dev/guide/essentials/config/build-mode

Use import.meta.env.MODE within your extension code to conditionally execute logic based on the active build mode.

```ts
switch (import.meta.env.MODE) {
  case 'development': // ...
  case 'production': // ...

  // Custom modes specified with --mode
  case 'testing': // ...
  case 'staging': // ...
  // ...
}
```

--------------------------------

### Define Runtime App Configuration

Source: https://wxt.dev/guide/essentials/config/runtime

Define your application's runtime configuration in `app.config.ts`. Ensure you declare the types for your config in the `WxtAppConfig` interface.

```typescript
import { defineAppConfig } from '#imports';

// Define types for your config
declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    theme?: 'light' | 'dark';
  }
}

export default defineAppConfig({
  theme: 'dark',
});
```

--------------------------------

### Generate Runtime Modules

Source: https://wxt.dev/guide/essentials/wxt-modules

Create virtual modules with aliases and auto-imports by hooking into the prepare:types lifecycle.

```ts
import { defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';

export default defineWxtModule({
  imports: [
    // Add auto-imports
    { from: '#analytics', name: 'analytics' },
    { from: '#analytics', name: 'reportEvent' },
    { from: '#analytics', name: 'reportPageView' },
  ],

  setup(wxt) {
    const analyticsModulePath = resolve(
      wxt.config.wxtDir,
      'analytics/index.ts',
    );
    const analyticsModuleCode = `
      import { createAnalytics } from 'some-module';

      export const analytics = createAnalytics(getAppConfig().analytics);
      export const { reportEvent, reportPageView } = analytics;
    `;

    addAlias(wxt, '#analytics', analyticsModulePath);

    wxt.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: analyticsModulePath,
        text: analyticsModuleCode,
      });
    });
  },
});
```

--------------------------------

### Include Related Files in Entrypoint Directory

Source: https://wxt.dev/guide/essentials/entrypoints

Group related files within an entrypoint directory to keep the root clean.

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

### Flatten Nested Entrypoints

Source: https://wxt.dev/guide/essentials/entrypoints

WXT does not support deep nesting; use flat naming conventions instead.

```html
📂 entrypoints/
   📂 youtube/ <!-- [!code --] -->
       📂 content/ <!-- [!code --] -->
          📄 index.ts <!-- [!code --] -->
          📄 ... <!-- [!code --] -->
       📂 injected/ <!-- [!code --] -->
          📄 index.ts <!-- [!code --] -->
          📄 ... <!-- [!code --] -->
   📂 youtube.content/ <!-- [!code ++] -->
      📄 index.ts <!-- [!code ++] -->
      📄 ... <!-- [!code ++] -->
   📂 youtube-injected/ <!-- [!code ++] -->
      📄 index.ts <!-- [!code ++] -->
      📄 ... <!-- [!code ++] -->
```

--------------------------------

### Manually import WXT APIs via `#imports`

Source: https://wxt.dev/guide/essentials/config/auto-imports

Explicitly import all of WXT's APIs from the `#imports` module. This is useful if you have disabled auto-imports or prefer explicit imports.

```typescript
import {
  createShadowRootUi,
  ContentScriptContext,
  MatchPattern,
} from '#imports';
```

--------------------------------

### Configuring Manifest with Environment Variables

Source: https://wxt.dev/guide/essentials/config/environment-variables

Use the function syntax for the manifest configuration to access environment variables like WXT_APP_CLIENT_ID, as dotenv files are loaded after the config.

```typescript
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: () => ({
    oauth2: {
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    }
  }),
});
```

--------------------------------

### WXT Output Directory Structure Change

Source: https://wxt.dev/guide/resources/upgrading

JS entrypoints have been moved within the output directory. This change primarily affects post-build processes that reference these files directly.

```plaintext
.output/
  <target>/
    chunks/
      some-shared-chunk-<hash>.js
      popup-<hash>.js // [!code --]
    popup.html
    popup.html
    popup.js // [!code ++]
```

--------------------------------

### Create Message Files Structure

Source: https://wxt.dev/guide/essentials/i18n

Organize your translation files within the `public/_locales/` directory, with subdirectories for each language code.

```directory
📂 {rootDir}/
   📂 public/
      📂 _locales/
         📂 en/
            📄 messages.json
         📂 de/
            📄 messages.json
         📂 ko/
            📄 messages.json
```

--------------------------------

### Configure Default Side Panel

Source: https://wxt.dev/guide/essentials/entrypoints

Use meta tags in the HTML head to configure default side panel options like icons, open behavior, and browser styling. These settings are applied during the build process.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Default Side Panel Title</title>

    <!-- Customize the manifest options -->
    <meta
      name="manifest.default_icon"
      content="{
        16: '/icon-16.png',
        24: '/icon-24.png',
        ...
      }"
    />
    <meta name="manifest.open_at_install" content="true|false" />
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

### Generate Output Files in WXT

Source: https://wxt.dev/guide/essentials/wxt-modules

Use build hooks to add public assets and update the manifest with generated files.

```ts
import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  setup(wxt) {
    // Relative to the output directory
    const generatedFilePath = 'some-file.txt';

    wxt.hook('build:publicAssets', (_, assets) => {
      assets.push({
        relativeDest: generatedFilePath,
        contents: 'some generated text',
      });
    });

    wxt.hook('build:manifestGenerated', (_, manifest) => {
      manifest.web_accessible_resources ??= [];
      manifest.web_accessible_resources.push({
        matches: ['*://*'],
        resources: [generatedFilePath],
      });
    });
  },
});
```

```ts
const res = await fetch(browser.runtime.getURL('/some-text.txt'));
```

--------------------------------

### Implement Unlisted Script for Main World

Source: https://wxt.dev/guide/essentials/content-scripts

Defines an unlisted script entrypoint to be injected into the main world.

```ts
// entrypoints/example-main-world.ts
export default defineUnlistedScript(() => {
  console.log('Hello from the main world');
});
```

--------------------------------

### Configure Manifest for Localized Name/Description

Source: https://wxt.dev/guide/essentials/i18n

Set the `name` and `description` properties in your manifest to use the `__MSG_messageName__` format, linking them to your defined translations.

```typescript
export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
  },
});
```

--------------------------------

### Enable ESLint auto-imports configuration (v9)

Source: https://wxt.dev/guide/essentials/config/auto-imports

Enable WXT to generate an ESLint v9 auto-imports configuration. This allows ESLint to recognize auto-imported variables.

```typescript
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
});
```