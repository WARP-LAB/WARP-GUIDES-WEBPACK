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
    ctx.env === 'development'
      ? null
      : require('cssnano')({
        // https://cssnano.co/guides/optimisations
        preset: ['default', {
          autoprefixer: false, // do not remove prefixes
          discardComments: {
            removeAll: true
          },
          normalizeUrl: false,
          normalizeWhitespace: true,
          zindex: false
        }]
      })
  ].filter((e) => e !== null)
});
