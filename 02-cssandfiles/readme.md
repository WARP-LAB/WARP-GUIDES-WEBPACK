# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# In this section
---

* PostCSS
* Bootstrapping CSS with *normalize.css*
* CSS source maps
* Font loading
* Image loading and compression

---
# Prefligt
---

Use existing `webpacktest-helloworld` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-cssandfiles`. Make changes in `package.json` name field. Don't forget `npm install`.

---
# PostCSS
---

One does not simply... don't use PostCSS. [Use plugins!](https://cdn.meme.am/instances/500x/68322636.jpg)

### Loader and plugins

Loader  
[postcss-loader](https://github.com/postcss/postcss-loader)  

Basic PostCSS plugins and their documentation  
[autoprefixer](https://github.com/postcss/autoprefixer)  
[node-css-mqpacker](https://github.com/hail2u/node-css-mqpacker)  
[cssnano](https://github.com/ben-eb/cssnano)

```sh
npm install postcss-loader --save-dev
npm install autoprefixer --save-dev
npm install css-mqpacker --save-dev
npm install cssnano --save-dev
```

### Notes

It is [recommended](https://github.com/postcss/postcss-loader#plugins) to use seperate `postcssrc.js` file. All possible filenames and formats (JSON, YAML, JS) are discussed [here](https://github.com/michael-ciniawsky/postcss-load-config)

We could minify CSS using [css-loader](https://github.com/webpack-contrib/css-loader#minimize) (that uses `cssnano` under the hood), but let us do separate pass for minification via PostCSS ecosystem (using same `cssnano`). Let us keep CSS processing in as few places as possible.

### PostCSS configuration file

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
    require('css-mqpacker')(),
    // we always minimise CSS, also on dev, as we have source maps, but this shows how we can make this env aware
    ctx.env === 'development'
    ? null
    : require('cssnano')({
      discardComments: {
        removeAll: true
      },
      autoprefixer: false,
      zindex: false,
      normalizeUrl: false
    })
  ].filter((e) => e !== null)
});
```

### Autoprefixer

`autoprefixer` (browserslist) rules [should](https://github.com/postcss/autoprefixer#browsers) be put into either `package.json` or `browserslist` (multiple filenames supported) config file ([see docs](https://github.com/ai/browserslist#packagejson)). We are going to put them in `.browserslistrc`.

Docs for autoprefixer rules found in _.postcssrc.js_ can be found [here](https://github.com/postcss/autoprefixer#options).

We will target super old browsers to see the result. Add new file at project root.

_.browserslistrc_

```
[production]
last 2 versions
Explorer 10
iOS > 7

[development]
> 0.0001%
```

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
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
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
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
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
        ]
      })
    }
  ]
};

// ...
```

Run for development and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Prefixes!

Run for production and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Minification!

---
# normalize.css
---

Always use [Normalize.css](https://necolas.github.io/normalize.css/). Although our usual *cut the mustard* at preflight enables fallback page for anything below IE11 this fallback has to look O.K.. Use Normalize.css that supports IE8+ (which is 7.x as of now.)

```sh
npm install normalize.css --save-dev
```

Add to _src/index.global.scss_ SCSS `@import '~normalize.css';`

We add it as a module, so we prefix it with `~`. Now you know what `resolve: { modules: [] }` in webpack config stands for. Search paths!

Run webpack and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

---
# Webpack CSS source maps
---

As you can see we pass `sourceMap` option to our CSS related loaders. But where are the source maps, no inline or map files are present, when inspecting `.app` class in browser's devtools it references to compiled `index.css`, not `index.global.scss` which is the actual *source*.

Use webpack [devtool](https://webpack.js.org/configuration/devtool/) configuration.

Try

_webpack.front.config.js_

```javascript
// ...

// ----------------
// Source map conf
const sourceMapType = (development) ? 'inline-source-map' : false;

// ...

let config = {
  devtool: sourceMapType,
  // ...
};

// ...

if (production) {
  config.plugins.push(new UglifyJsPlugin({
    // ...
    sourceMap: sourceMapType // evaluates to bool
  }));
}

// ...
```

Run webpack for development and production and inspect last lines of `public/assets/index.js` and `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Inspect `.app` class in browser's inspector.

Keep `inline-source-map` for now. It has slow performance, read more [here](https://webpack.js.org/guides/build-performance/#devtool).

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
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
// ...
```

Usage example

_index.global.scss_

```scss
@charset 'UTF-8';
@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: magenta;
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

Build for *development* and *production*, note the difference in browser.

---
# Loading files
---

Now let us add some images to source.  
Have `my-small-image.jpg` below 20 KB. See `media` dir in this repo ([or this is handy](http://lorempixel.com/200/200/)).  
Have `my-large-image.jpg` at about 50 KB. See `media` dir in this repo ([or this is handy](http://lorempixel.com/600/600/)).  
Put them under `src/images` directory.

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
@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: magenta;
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

Add loaders to module rules. Note that we resolve URLs in SCSS pipe as well we add loader for image files (don't be surprised about not including SVG, later on that).

_webpack.front.config.js_

```javascript
// ...

config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
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
              keepQuery: true
            }
          }
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
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
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        }
      ]
    }
  ]
};

// ...
```

Run webpack and inspect `public/assets/` directory and `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Notice how larger image is outputted as file while smaller image is inlined

```css
.app {
  background-image: `url(data:image/jpeg;base64,...);
```

in CSS. Just as intended.

---
# Compressing images using `image-webpack-loader`
---

But we can do better. Let us minify the images.  
_Minify PNG, JP(E)G, GIF and SVG images with [imagemin](https://github.com/imagemin/imagemin)._

Loader  
[image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)  

```sh
brew install automake libtool libpng
npm install image-webpack-loader --save-dev
```

See docs, we keep default minification opts here.  
This process is expensive. In development we do not care about file size, so enable it only for nondevelopment

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        (!development)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    }
// ...
```

Run webpack and inspect `public/assets/` directory, how outputted image size differs from source.

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

---
# Fonts
---

## Building

This example uses bulletproof syntax although [you can retire it](https://www.zachleat.com/web/retire-bulletproof-syntax/).

Convert TTF/OTF to all webwonts (WOFF, WOFF2, EOT, SVG) in building process. Font squirrel online generator is good enough [Font Squirrel Generator](https://www.fontsquirrel.com/tools/webfont-generator), or use [fontplop](https://github.com/matthewgonzalez/fontplop)

All webfonts should end with `*-webfont.ext` in their filename.

See `media` directory in this repo!

## Packing & loading

Let us use [Space Mono](https://www.fontsquirrel.com/fonts/space-mono).  

We need also extra file `fonts/spacemono-definition.global.scss`.

Define font family. 

_fonts/spacemono-definition.global.scss_

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
@import '~normalize.css';
@import 'typography.global.scss';
@import 'index.legacy.css';

// ...
```

Add loaders for font files in webpack config. We can simply use `file-loader` but as an example use `url-loder` here as a reminder that there are those rare cases where base64 inlining makes sense. Anyways, we set limit so low, that no fonts will be inlined into CSS.

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
          mimetype: 'application/x-font-opentype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-truetype' // application/font-sfnt
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

Run webpack and inspect `public/assets/` directory and `public/assets/index.css` as well as how it looks in browser.

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

## Webpack SVG images vs SVG fonts

Let us distinguish between webfonts and images. We do it by namig convention. To do so, all webfonts alaways have to be suffixed with `-webfont`. If the *bulletproof syntax* is dropped then this can be avoided.

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
            limit: 20000
          }
        },
        (production)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    },

//...
```

---
# GLSL shader file loading
---

We write our shaders in separate files and build them within app.

There are two loaders that we have used, both work.

[webpack-glsl-loader](https://github.com/grieve/webpack-glsl-loader)

```sh
npm install webpack-glsl-loader --save-dev
```

_webpack.front.config.js_

```javascript
// ...

    {
      test: /\.(glsl|frag|vert)$/,
      use: 'webpack-glsl-loader'
    }

// ...
```

_example.js_

```javascript
// ...
  uniformTex0 = THREE.ImageUtils.loadTexture('path/to/texture.jpg');
// ...
  shaderProg = new THREE.ShaderMaterial({
    // ...
    uniforms: {
      // ...
      inTex0: {type: 't', value: uniformTex0},
    },
    // ...
    vertexShader: require('path/to/shader.vert'),
    fragmentShader: require('path/to/shader.frag')
  });
// ...
```

[phaser-glsl-loader](https://github.com/the-simian/phaser-glsl-loader)

```sh
npm install phaser-glsl-loader --save-dev
```

_webpack.front.config.js_

```javascript
    {
      test: /\.(glsl|frag|vert)$/,
      use: 'phaser-glsl-loader'
    }
```

_example.js_

```javascript
// ...
  shaderProg = new THREE.ShaderMaterial({
    // ...
    vertexShader: require('path/to/shader.vert').join('\n'),
    fragmentShader: require('path/to/shader.frag').join('\n')
  });
// ...
```

---
# Next
---

Using webpack without it's devserver is dubious.