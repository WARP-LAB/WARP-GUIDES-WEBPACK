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
          discardComments: true,
          // discardComments: {
          //   removeAll: true,
          // },
          normalizeUrl: false,
          normalizeWhitespace: true,
          zindex: false
        }]
      })
  ].filter((e) => e !== null)
});