# File loading

---
# In this section

* File loading
* Image compressing
* Font loading (example for old bulletproof syntax)

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-02-css-and-postcss`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-03-file-loading`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.

```sh
cd webpacktest-03-file-loading
npm install
```

---
# Loading files

Add some images to source.  
Have `my-small-image.jpg` below 20 KB. [helper](https://picsum.photos/200/200/)  
Have `my-large-image.jpg` at about 50 KB. [helper](https://picsum.photos/600/600/)   
Have `my-js-image.jpg`. [helper](https://picsum.photos/200/200/)  
See `media/images` dir in this repo where images are already prepared. Copy `media/images` directory contents to `src/images`.

Loaders  
[file-loader](https://github.com/webpack-contrib/file-loader)  
[resolve-url-loader](https://github.com/bholloway/resolve-url-loader)  
[url-loader](https://github.com/webpack-contrib/url-loader)  

`resolve-url-loader` is needed because file paths can be set relative to the code file the file is required from (but can also be required *relative* to resolve paths as set in webpack config).

`url-loader` works like the file loader, but can return a *Data Url* if the file is smaller than a limit.  

```sh
npm install file-loader --save-dev
npm install resolve-url-loader --save-dev
npm install url-loader --save-dev
```

Adding images to SCSS

_src/index.global.scss_

```scss
@charset 'UTF-8';

// This is example of SCSS

@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: green;
} @else {
  $paragarphColor: yellow;
}

body {
  background-image: url('images/my-large-image.jpg');
}

.app {
  background-color: $mycolor;
  transform: translateY(50px);
  height: 200px;

  h1 {
    display: flex;
  }

  p {
    color: $paragarphColor;
  }

  background-image: url('images/my-small-image.jpg');
}

```

Adding images to JavaScript

_src/index.js_

```javascript
// index.js

/* global __DEVELOPMENT__ */

'use strict';

var helpers = require('extras/helpers.simple.js');
require('index.global.scss');
var myImage = require('images/my-js-image.jpg').default;

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
div.innerHTML += '<p><img src="' + myImage + '" alt="My Image"></p>';
div.innerHTML += '<p><label for="textfield">Enter your text</label></p>';
div.innerHTML += '<p><input id="textfield" type="text" name="testtext" placeholder="Text Here"/></p>';
console.log('Hello JS!');
helpers.helperA();

```


### `file-loader` example

Pipe images that are required by CSS (and JS) to build directory. There is a specific SVG targeting regex, later on that.

Add loaders to module rules. Note that we resolve URLs in (S)CSS pipe & add loader for image files.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: [
        development
          ? {
            loader: 'style-loader',
            options: {}
          }
          : {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            sourceMap: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true
          }
        },
        {
          loader: 'resolve-url-loader',
          options: {
            sourceMap: true,
            keepQuery: true
          }
        }
      ]
    },
    {
      test: /\.(scss)$/,
      use: [
        development
          ? {
            loader: 'style-loader',
            options: {}
          }
          : {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 3,
            sourceMap: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true
          }
        },
        {
          loader: 'resolve-url-loader',
          options: {
            sourceMap: true,
            keepQuery: true
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            prependData: `$env: ${tierName};`
          }
        }
      ]
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    }
  ]
};

// ...
```

Run webpack for `development` and `testing` tiers.

```sh
npm run front:build:dev
```

```sh
npm run front:build:test
```

One can observe that images are outputted to filesystem `public/assets` as expected in both cases.  

Note that later there might be discussion that path to assets actually could be FQDN, which would solve the issue expanded below, but for now stick with *relative-to-index paths*, which is a bit painful to set up.

**There is an issue with loading images in browser.**

Image that is required in JS source is displayed both when being in `development` tier as well as `testing` tier.
Compiled javaScript code that generates HTML references the image as 

```html
<img src="assets/<imagename>.<ext>" alt="My Image">
```

and that is correct relative path from `public/index.html`


Images that are required in CSS source when being in `development` tier are displayed. But when in `testing` tier (or more precisely, when in *non-development*) tier *404*s are thrown and browser fails to display images.  

In *development tier* CSS source is compiled within JavaScript (`public/assets/index.js`).  
Compiled CSS code that is embedded in JavaScript references the images as 

```css
background-image:url(assets/<imagename>.<ext>)
```
JavaScript loads assets relative to the HTML, thus images work as `assets/<imagename>.<ext>` is correct path to images in the filesystem relative to `public/index.html`

In *testing tier* CSS source is compiled to separate CSS file (`public/assets/index.css`).  
Compiled CSS code references the images as 

```css
background-image:url(assets/<imagename>.<ext>)
```
CSS loads assets relative to itself, thus images do not work as `assets/<imagename>.<ext>` is incorrect path to image in the filesystem relative to `public/assets/index.css`.

Solving the issue.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// Relative URL type based on env, or false if not relative
// Assumed values to be used: 'app-index-relative'; 'server-root-relative'; false (if not relative, but FQDN used)
// Value MUST be 'app-index-relative' if index.html is opened from local filesystem directly and CSS is not inlined in JS
const relativeUrlType = 'app-index-relative';

// ----------------
// MiniCssExtractPlugin publicPath
const miniCssExtractPublicPath = (development) ? appPathUrlBuildPublicPath : (relativeUrlType === 'app-index-relative') ? './' : appPathUrlBuildPublicPath;

// ...

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: [

          // ...

          : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: miniCssExtractPublicPath
            }
          },

          // ...

      ]
    },
    {
      test: /\.(scss)$/,
      use: [

          // ...
          
          : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: miniCssExtractPublicPath
            }
          },
          
          // ...
      ]
    },

    // ...

  ]
};
    
// ...

```

Run webpack for `development` and `testing` tiers.

```sh
npm run front:build:dev
```

```sh
npm run front:build:test
```

Images now render also in *testing tier* as built CSS file `public/assets/index.css` references images relative to compiled CSS file correctly.

### `url-loader` example

A feature that can be used in case of HTTP/1.1 is *embedding* small assets in CSS. Change `file-loader` to `url-loader`.

_webpack.front.config.js_

```javascript
// ...

    // {
    //   test: /\.(png|jpe?g|gif|svg)$/,
    //   exclude: /.-webfont\.svg$/,
    //   use: [
    //     {
    //       loader: 'file-loader',
    //       options: {}
    //     }
    //   ]
    // }
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        }
      ]
    }

// ...
```

Running webpack for *testing tier*, inspecting `public/assets/` directory and inspectting `body` and `.app` CSS.  
Larger image (`body`) is outputted as file in `public/assets/` while smaller image (`.app`) is inlined as base64 in CSS (assuming that one is below and other is above the size limit as set for `url loader` - `limit: 20000`). Just as intended.

Further using `file-loader` though.

---
# Compressing images using `image-webpack-loader`

It is possible to compress the images while building.  
_Minify PNG, JP(E)G, GIF, SVG and WEBP images with [imagemin](https://github.com/imagemin/imagemin)._

Loader  
[image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)  

```sh
# if using macOS: brew install automake libtool libpng
npm install image-webpack-loader --save-dev
```

See [imagemin](https://github.com/imagemin/imagemin) docs, default minification options are kept in this tut.  
This process is expensive. In development one should not care about file size, so it is enabled only for nondevelopment

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        },
        {
          loader: 'image-webpack-loader',
          options: {
            disable: development
          }
        }
      ]
    }
// ...
```

After running webpack for testing tier outputted image filesizes differ (are smaller) in `public/assets/` from source (for such small filesizes the gains will not be much though).

```sh
npm run front:build:test
```

---
# Fonts

## Building

This example uses *bulletproof syntax* although [it can be retired for good reasons](https://www.zachleat.com/web/retire-bulletproof-syntax/).

All webfonts should end with `*-webfont.ext` in their filename for following examples.

Copy contents (`spacemono` directory and `spacemono-definition.global.scss` file) of `media/fonts/` directory found in this repo to `src/fonts/`

## Packing & loading

[Space Mono](https://www.fontsquirrel.com/fonts/space-mono) family is used as example font.

After copying files `src/fonts/spacemono-definition.global.scss` holds `@font-face` definitions and refer to font files within `src/fonts/spacemono`.

Importing definitions into SCSS file for typography and setting other options.

_src/typography.global.scss_

```scss
@charset 'UTF-8';

@import 'fonts/spacemono-definition.global.scss';

body {
  font-family: 'spacemono-webpack', 'Comic Sans MS', monospace;
  font-weight: 400;
}

em,
i { font-style: italic; }

strong,
b {
  font-weight: 700;
}

strong em,
strong i,
b em,
b i,
em strong,
em b,
i strong,
i b {
  font-weight: 700;
  font-style: italic;
}
```

Importing typography into app index SCSS

_src/index.global.scss_

```scss
@charset 'UTF-8';

// This is example of SCSS

@import '~normalize.css';
@import 'typography.global.scss';
@import 'index.legacy.css';

// ...
```

Adding loaders for font files in webpack config.

`file-loader` not `url-loder` will be used, but if one is using the latter, mime type should be specified, meaning if

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.<fontextension>$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: '<correct-mime-type-for-font>'
        }
      }]
    },
// ...
```

then

| `<fontextension>` | `<correct-mime-type-for-font>` |
| --- | --- |
| `woff2` | `application/font-woff2` |
| `woff` | `application/font-woff` |
| `otf` | `application/x-font-opentype` |
| `ttf` | `application/x-font-truetype` |
| `eot` | `application/vnd.ms-fontobject` |
| `svg` | `mimetype=image/svg+xml` |
  

Setting `file-loader` for font files.

_webpack.front.config.js_

```javascript
// ...
    {
      test: /.-webfont\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    }
// ...
```

Running webpack for both tiers yields *Space Mono* applied to the rendered HTML.

## Webpack SVG images vs SVG fonts

As *bulletproof syntax* is assumed there is distinguish between webfonts and images in case of SVG. It is done by naming convention. All SVG webfonts are assumed to have suffix `-webfont`. If the *bulletproof syntax* is dropped then this can be ignored. This is already adressed using `exclude` rule.

---
# Result

See `webpacktest-03-file-loading` directory.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

---
# Next

Using webpack without it's devserver is dubious.