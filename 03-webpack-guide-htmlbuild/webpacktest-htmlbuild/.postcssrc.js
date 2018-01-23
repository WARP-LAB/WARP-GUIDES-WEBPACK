module.exports = (ctx) => ({
  plugins: [
    require('autoprefixer')({
      // browsers: [], // defined in .browserslistrc file!
      cascade: true,
      remove: true
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
