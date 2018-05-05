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
    // we can always minimise CSS, as we use source maps, but this shows how we can make this env aware
    ctx.env === 'development'
    ? null
    : require('cssnano')({
      discardComments: {
        removeAll: true
      },
      autoprefixer: false, // we do it explicitly using autoprefixer
      zindex: false,
      normalizeUrl: false
    })
  ].filter((e) => e !== null)
});
