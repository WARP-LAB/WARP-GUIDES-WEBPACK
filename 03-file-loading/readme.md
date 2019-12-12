# SCSS, CSS, PostCSS settings and file loading

---
# In this section

* File loading
* Image compressing
* Font loading (example for old bulletproof syntax)

---
# Prefligt

Use existing code base from previous guide stage (`webpacktest-02-css-and-postcss`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-03-file-loading`.  
Make changes in `package.json` name field.  
Dont forget `npm install`.

```sh
cd webpacktest-03-file-loading
npm install
```

---
# Loading files

Now let us add some images to source.  
Have `my-small-image.jpg` below 20 KB. [helper](http://lorempixel.com/200/200/)  
Have `my-large-image.jpg` at about 50 KB. [helper](http://lorempixel.com/600/600/)   
See `media/images` dir in this repo where images are already prepared. Copy `images` directory to `src/images`.

Loaders  
[file-loader](https://github.com/webpack-contrib/file-loader)  
[url-loader](https://github.com/webpack-contrib/url-loader)  
[resolve-url-loader](https://github.com/bholloway/resolve-url-loader)

`url-loader` works like the file loader, but can return a *Data Url* if the file is smaller than a limit.  
`resolve-url-loader` is needed because we set file path in `url()` relative to the SCSS file we are working in, however webpack tries to resolve from entry point.

```sh
npm install file-loader --save-dev
npm install url-loader --save-dev
npm install resolve-url-loader --save-dev
```

Add images to our SCSS

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
  background-image: url('./images/my-large-image.jpg');
}

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;

  p {
    color: $paragarphColor;
  }

  background-image: url('./images/my-small-image.jpg');
}
```


### `file-loader` example

Pipe images that are required by CSS (and JS) to build directory. Don't be surprised about special SVG regex, later on that.

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
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
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
      ],
    },
    {
      test: /\.(scss)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
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
            prependData: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
          }
        }
      ],
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

One can observe that images are outputted to `public/assets` as expected in both cases.  
But there is an issue with loading images in browser.  
When being in `development` tier images are displayed (as there is no actual CSS, it is served by javascript via `style-loader`), but when in `testing` (or more precisely, when in *non-development*) tier we get *404*s and browser fails to display images.

The issue is that in `testing` tier images within built CSS file at `public/assets/index.css` are referenced as 

```css
background-image:url(assets/<imagename>.<ext>)
```

although the correct *relative path* should be 

```css
background-image:url(<imagename>.<ext>)
```

as images are in same directory as CSS file referencing them.

Later we will discuss that path to assets actually could be FQDN, but let us stick with *relative-to-index paths* for now.


```javascript
// ...

// ----------------
// Relative URL type based on env, or false if not relative
// Assumed values to be used:
//    'app-index-relative'
//    'server-root-relative'
//    false (if not relative, but FQDN used)
// Note that value MUST be 'app-index-relative' if index.html is opened from local filesystem directly
let relativeUrlType = 'app-index-relative';

// ----------------
// file-loader publicPath
const fileLoaderPublicPath = (development) ? '' : (relativeUrlType === 'app-index-relative') ? './' : '';

// ...

    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: fileLoaderPublicPath
          }
        }
      ]
    }
    
// ...

```

Run webpack for `development` and `testing` tiers.

```sh
npm run front:build:dev
```

```sh
npm run front:build:test
```

Images should now render in *testing tier* as built CSS file `public/assets/index.css` should reference images relative to CSS file correctly.

### `url-loader` example

A feature that can be used in case of HTTP/1.1 is *embedding* small assets in CSS. Change `file-loader` to `url-loader`.

_webpack.front.config.js_

```javascript
// ...

    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000,
            publicPath: fileLoaderPublicPath
          }
        }
      ]
    }

// ...
```

Run webpack and inspect `public/assets/` directory and inspect `body` and `.app` CSS in `public/assets/index.css`.  
Notice how larger image is outputted as file in `public/assets/` while smaller image is inlined as base64 in CSS (assuming that one is below and other is above the size limit as set for `url loader` - `limit: 20000`). Just as intended in this exercise.

Further use `file-loader` though as we target HTTP/2-ready serverside.

---
# Compressing images using `image-webpack-loader`

But we can do better. Let us minify the images.  
_Minify PNG, JP(E)G, GIF and SVG images with [imagemin](https://github.com/imagemin/imagemin)._

Loader  
[image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)  

```sh
# if using macOS: brew install automake libtool libpng
npm install image-webpack-loader --save-dev
```

See docs, we keep default minification opts here.  
This process is expensive. In development we do not care about file size, so enable it only for nondevelopment

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: fileLoaderPublicPath
          }
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

Run webpack for testing and observe how outputted image filesizes differ in `public/assets/` from source (for such small filesizes the gains will not be much though).

---
# Fonts

## Building

This example uses *bulletproof syntax* although [it can be retired for years and for good reasons](https://www.zachleat.com/web/retire-bulletproof-syntax/).

All webfonts should end with `*-webfont.ext` in their filename for following examples.

See `media/fonts/spacemono` directory in this repo.  
Create directory `src/fonts/`.  
Put directory `media/fonts/spacemono` into `src/fonts/`.

## Packing & loading

Let us use [Space Mono](https://www.fontsquirrel.com/fonts/space-mono).  

Create and fill in file `fonts/spacemono-definition.global.scss`.

_src/fonts/spacemono-definition.global.scss_

```scss
@charset 'UTF-8';

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-bold-webfont.eot');
  src:
    url('./spacemono/spacemono-bold-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-bold-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-bold-webfont.woff') format('woff'),
    url('./spacemono/spacemono-bold-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-bold-webfont.svg#space_monobold') format('svg');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-bolditalic-webfont.eot');
  src:
    url('./spacemono/spacemono-bolditalic-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-bolditalic-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-bolditalic-webfont.woff') format('woff'),
    url('./spacemono/spacemono-bolditalic-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-bolditalic-webfont.svg#space_monobold_italic') format('svg');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-regular-webfont.eot');
  src:
    url('./spacemono/spacemono-regular-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-regular-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-regular-webfont.woff') format('woff'),
    url('./spacemono/spacemono-regular-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-regular-webfont.svg#space_monoregular') format('svg');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-italic-webfont.eot');
  src:
    url('./spacemono/spacemono-italic-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-italic-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-italic-webfont.woff') format('woff'),
    url('./spacemono/spacemono-italic-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-italic-webfont.svg#space_monoitalic') format('svg');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
```

Import definitions, set typography globals

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

Import typography into index SCSS

_src/index.global.scss_

```scss
@charset 'UTF-8';

// This is example of SCSS

@import '~normalize.css';
@import 'typography.global.scss';
@import 'index.legacy.css';

// ...
```

Add loaders for font files in webpack config.

We will use `file-loader` not `url-loder`, but if you are using the latter, specify mime type settings, meaning that if you have

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
  

Back to `file-loader` for font files

_webpack.front.config.js_

```javascript
    {
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: fileLoaderPublicPath
          }
        }
      ]
    }
```

Run webpack and inspect `public/assets/` directory as well as how it looks in browser.

## Webpack SVG images vs SVG fonts

Let us distinguish between webfonts and images in case os SVG, because we asume *bulletproof syntax*. We do it by naming convention. To do so, all svg webfonts alaways have to be suffixed with `-webfont`. If the *bulletproof syntax* is dropped then this can be ignored. This is already adressed using `exclude` rule.

_webpack.front.config.js_

```javascript
// ...

    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: fileLoaderPublicPath
          }
        },
        {
          loader: 'image-webpack-loader',
          options: {
            disable: development
          }
        }
      ]
    },
    {
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: fileLoaderPublicPath
          }
        }
      ]
    }

//...
```

---
# Result

See `webpacktest-02-css-and-files` directory.

---
# Next

Using webpack without it's devserver is dubious.