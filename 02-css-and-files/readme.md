# Extra CSS, PostCSS settings and file loading

---
# In this section
---

* PostCSS
* Bootstrapping CSS with *normalize.css*
* CSS source maps
* Making SCSS tier aware
* Image loading
* Image compressing
* Font loading (example for old bulletproof syntax)

---
# Prefligt
---

Use existing code base from previous guide stage (`webpacktest-01-hello-world`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-02-css-and-files`.  
Make changes in `package.json` name field.  
Dont forget `npm install`.

```sh
cd webpacktest-02-css-and-files
npm install
```

---
# PostCSS
---

Use PostCSS.

### Loader and plugins

Loader  
[postcss-loader](https://github.com/postcss/postcss-loader)  

Basic PostCSS plugins and their documentation  
[autoprefixer](https://github.com/postcss/autoprefixer)  
[cssnano](https://github.com/cssnano/cssnano)  
[node-css-mqpacker](https://github.com/hail2u/node-css-mqpacker) (beware, it is [depreciated](https://github.com/hail2u/node-css-mqpacker/issues/72), but still useful)  

```sh
npm install postcss-loader --save-dev
npm install autoprefixer --save-dev
npm install cssnano --save-dev
```

### PostCSS configuration file

It is [recommended](https://github.com/postcss/postcss-loader#plugins) to use separate configuration file for PostCSS. All possible filenames and formats (JSON, YAML, JS) are discussed [here](https://github.com/michael-ciniawsky/postcss-load-config).

Choosing JS file to set configuration as that enables some logic in the configuration file.

Add new file at project root.

_.postcssrc.js_

```javascript
module.exports = (ctx) => ({
  plugins: [
    require('autoprefixer')({
      // browsers: [], // defined in .browserslistrc file!
      cascade: true,
      add: true,
      remove: false,
      supports: true,
      flexbox: true,
      grid: false
    }),
    // require('css-mqpacker')(), // depreciated
    // this shows how we can make logic env aware
    ctx.env === 'development'
      ? null
      : require('cssnano')({
        // https://cssnano.co/guides/optimisations
        preset: ['default', {
          autoprefixer: false, // do not remove prefixes  
          discardComments: {
            removeAll: true,
          },
          normalizeUrl: false,
          normalizeWhitespace: true,
          zindex: false
        }]
      })
  ].filter((e) => e !== null)
});
```

### cssnano

We will minify CSS using a separate pass via PostCSS ecosystem (using `cssnano`, of course [alternatives exist](https://goalsmashers.github.io/css-minification-benchmark/)).  

Let us keep CSS processing in as few places as possible. See also [webpack docs](https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production).

### Autoprefixer

`autoprefixer` (browserslist) rules [should](https://github.com/postcss/autoprefixer#browsers) be put into some [config file](https://github.com/browserslist/browserslist#config-file).  
We are going to put them in `.browserslistrc`.

Docs for autoprefixer rules found in _.postcssrc.js_ can be found [here](https://github.com/postcss/autoprefixer#options).

We will target super old browsers to see the result. Add new file at project root.

_.browserslistrc_

```
[production staging testing]
> 0.0001%

[development]
> 0.0001%
```

We make use of [browserslist environments](https://github.com/browserslist/browserslist#configuring-for-different-environments).

### `postcss-loader`

Add loader in the pipe.

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
            importLoaders: 1,
            sourceMap: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true
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
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }
      ],
    }
  ]
};

// ...
```

### Remove `optimize-css-assets-webpack-plugin`

We do not need `optimize-css-assets-webpack-plugin` any more, as CSS optimization is done via PostCSS plugins. Remove it from _webpack.front.config.js_.

If you really want to use `optimize-css-assets-webpack-plugin`, then specify nanocss options [as per docs](https://github.com/NMFR/optimize-css-assets-webpack-plugin#configuration) in _webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: true, // can override
  minimizer: [
    // ...
    new OptimizeCSSAssetsPlugin({
      // HERE
    })
  ]
};

// ...
```

### Test it

Run for testing and inspect `public/assets/index.css`

```sh
npm run front:build:test
```

Prefixes for `flex` and `transform` and CSS is minimised.

---
# normalize.css
---

Use [Normalize.css](https://necolas.github.io/normalize.css/). Although our usual *cut the mustard* at preflight enables fallback page for anything below IE11 *the fallback has to be readbale*. There are alternatives such as [sanitize.css](https://github.com/csstools/sanitize.css) and [modern-normalize](https://github.com/sindresorhus/modern-normalize).

```sh
npm install normalize.css --save-dev
```

Add it to app SCSS

_src/index.global.scss_

```scss
@import '~normalize.css';

// ...
```

We add it as a module, so we prefix it with `~`. Now you know what `resolve: { modules: [] }` in webpack config stands for - search paths.

Run webpack and inspect `public/assets/index.css`

```sh
npm run front:build:test
```

---
# Webpack CSS source maps
---

As you can see we pass `sourceMap` option to our CSS related loaders. But where are the source maps? No inline or map files are present, when inspecting `.app` class in browser's devtools - it references to compiled `index.css`, not `index.global.scss` which is the actual *source*.

Use webpack [devtool](https://webpack.js.org/configuration/devtool/) configuration.

webpack *mode* sets it to *eval* in *development mode*, otherwise to none OOB.

Add source map logic also to TerserPlugin and [PostCSS pipe](https://github.com/postcss/postcss/blob/master/docs/source-maps.md#postcss-and-source-maps)

_webpack.front.config.js_

```javascript
// ...

// ----------------
// Source map conf
const sourceMapType = 'inline-source-map';

// ...

let config = {
  mode: development ? 'development' : 'production',
  devtool: sourceMapType,
  // ...
};

// ...

    new TerserPlugin({
      // ...
      sourceMap: !!sourceMapType,
      // ...
    })
    
    // ...

// ...
```

Run webpack for testing and inspect `.app` class in browser's inspector, you can see original definitions in `index.global.scss`. Inspect where console logs in javascript are coming from. It all refers to original sources.

Now run webpack for testing with external map file

_webpack.front.config.js_

```javascript
const sourceMapType = 'source-map';
```
inspect both browser inspector as well as `public/assets/` directory.

Eventually shange config to have source map only when using development tier and have it inlined

_webpack.front.config.js_

```javascript
const sourceMapType = (development) ? 'inline-source-map' : false;
```
Build both for development and any other tier, observe the difference

```sh
npm run front:build:dev
```

```sh
npm run front:build:test
```

Keep `inline-source-map` for now although it has slowest build & rebuild performance, read more [here](https://webpack.js.org/guides/build-performance/#devtool) and [here](https://webpack.js.org/configuration/devtool/).

---
# Make SCSS build environment aware
---

Our SCSS could also know what environment it is built for.

_webpack.front.config.js_

```javascript
// ...
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              prependData: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
// ...
```

Usage example

_index.global.scss_

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

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;

  p {
    color: $paragarphColor;
  }

}
```

Build for *development* and *testing* tiers, note the difference in browser.

---
# Loading files
---

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
// Note that value MUST be 'app-index-relative' if index.html is opened from local filesystem directlylet relativeUrlType;
if (development) {
  relativeUrlType = false;
}
else {
  relativeUrlType = 'app-index-relative';
} 

// ...

    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
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
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
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
---

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
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
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
---

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

We will use `file-loader` not `url-loder`, but this example shows mime type settings if you were to inline them.

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff2'
        }
      }]
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff'
        }
      }]
    },
    {
      test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-opentype'
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-truetype'
        }
      }]
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/vnd.ms-fontobject'
        }
      }]
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'mimetype=image/svg+xml'
        }
      }]
    }
// ...
```

Back to `file-loader` for font files

_webpack.front.config.js_

```javascript
    {
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
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
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
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
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
          }
        }
      ]
    }

//...
```

---
# Result
---

See `webpacktest-02-css-and-files` directory.

---
# Next
---

Using webpack without it's devserver is dubious.