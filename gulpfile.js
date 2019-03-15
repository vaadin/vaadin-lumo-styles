'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var htmlExtract = require('gulp-html-extract');
var stylelint = require('gulp-stylelint');
var find = require('gulp-find');
var replace = require('gulp-replace');
var expect = require('gulp-expect-file');
var grepContents = require('gulp-grep-contents');
var clip = require('gulp-clip-empty-files');
var git = require('gulp-git');

gulp.task('lint', ['lint:js', 'lint:html', 'lint:css']);

gulp.task('lint:js', function() {
  return gulp.src([
    '*.js',
    'test/*.js'
  ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError('fail'));
});

gulp.task('lint:html', function() {
  return gulp.src([
    '*.html',
    'demo/**/*.html',
    'test/**/*.html'
  ])
    .pipe(htmlExtract({
      sel: 'script, code-example code',
      strip: true
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError('fail'));
});

gulp.task('lint:css', function() {
  return gulp.src([
    '*.html',
    'demo/**/*.html',
    'mixins/**/*.html',
    'test/**/*.html'
  ])
    .pipe(htmlExtract({
      sel: 'style'
    }))
    .pipe(stylelint({
      reporters: [
        {formatter: 'string', console: true}
      ]
    }));
});

gulp.task('version:check', function() {
  const expectedVersion = new RegExp('^' + require('./package.json').version + '$');
  return gulp.src(['*.html'])
    .pipe(htmlExtract({sel: 'script'}))
    .pipe(find(/static get version.*\n.*/))
    .pipe(clip()) // Remove non-matching files
    .pipe(replace(/.*\n.*return '(.*)'.*/, '$1'))
    .pipe(grepContents(expectedVersion, {invert: true}))
    .pipe(expect({reportUnexpected: true}, []));
});

gulp.task('version:update', function() {
  // Should be run from 'preversion'
  // Assumes that the old version is in package.json and the new version in the `npm_package_version` environment variable
  const oldversion = require('./package.json').version;
  const newversion = process.env.npm_package_version;
  if (!oldversion) {
    throw new 'No old version found in package.json';
  }
  if (!newversion) {
    throw new 'New version must be given as a npm_package_version environment variable.';
  }
  return gulp.src(['*.html'])
    .pipe(replace(oldversion, newversion))
    .pipe(gulp.dest('.'))
    .pipe(git.add());
});


/* Generate icon formats (font icons and iron-iconset-svg) from source SVGs */

var iconfont = require('gulp-iconfont');
var exec = require('child_process').exec;
var fs = require('fs');
var svgpath = require('svgpath');
var svgmin = require('gulp-svgmin');

gulp.task('icons', function() {
  var folder = 'icons/svg/';
  var glyphs;

  // Optimize the source files
  gulp.src(folder + '*.svg')
    .pipe(svgmin({
      plugins: [{
        removeTitle: true
      }, {
        cleanupNumericValues: {
          floatPrecision: 6
        }
      }, {
        convertPathData: {
          floatPrecision: 6
        }
      }]
    }))
    .pipe(gulp.dest(folder))
    .on('finish', function(args) {
      // iron-iconset-svg
      fs.readdir(folder, function(err, filenames) {
        if (err) {
          console.error(err);
          return;
        }

        var output = `<!-- NOTICE: Generated with 'gulp icons' -->
<link rel="import" href="version.html">
<link rel="import" href="../iron-iconset-svg/iron-iconset-svg.html">
<iron-iconset-svg size="1000" name="lumo">
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
`;

        filenames.forEach(function(filename) {
          // Skip non-svg files
          if (filename.indexOf('.svg') === -1) {
            return;
          }

          var content = fs.readFileSync(folder + filename, 'utf-8');
          var path = content.match(/<path d="([^"]*)"/);
          if (path) {
            // var xScale = Math.min(1, fontHeight / glyphWidth);
            // var yScale = -1 * Math.min(1, fontHeight / glyphWidth);
            // var xTranslate = Math.max(0, (fontHeight - glyphWidth) / 2);
            // var yTranslate = -1 * fontAscent * (2 - Math.min(1, fontHeight / glyphWidth));
            var newPath = new svgpath(path[1])
              // .translate(xTranslate, yTranslate)
              .scale(1000 / 24, 1000 / 24)
              .round(0)
              .toString();
            var name = filename.replace('.svg', '').replace(/\s/g, '-').toLowerCase();
            output += `<g id="${name}"><path d="${newPath}"/></g>\n`;
          }
        });

        output += `</defs>
</svg>
</iron-iconset-svg>
`;

        fs.writeFile('iconset.html', output, function(err) {
          if (err) {
            return console.error(err);
          }
        });
      });

      // icon font
      gulp.src(folder + '*.svg')
        .pipe(iconfont({
          fontName: 'lumo-icons',
          formats: ['woff'],
          fontHeight: 1000,
          ascent: 850,
          descent: 150,
          fixedWidth: true,
          normalize: true,
        }))
        .on('glyphs', function(glyphData, options) {
          // Store for later use
          glyphs = glyphData;
        })
        .pipe(gulp.dest('.'))
        .on('finish', function(args) {
          // Generate base64 version of the font
          exec('base64 lumo-icons.woff', function(err, stdout, stderr) {
            // Write the output to font-icons.html
            var output = `<!-- NOTICE: Generated with 'gulp icons' -->
<link rel="import" href="../polymer/lib/elements/custom-style.html">
<link rel="import" href="version.html">

<custom-style>
  <style>
    @font-face {
      font-family: 'lumo-icons';
      src: url(data:application/font-woff;charset=utf-8;base64,${stdout.trim()}) format('woff');
      font-weight: normal;
      font-style: normal;
    }

    html {
`;
            glyphs.forEach(g => {
              var name = g.name.replace(/\s/g, '-').toLowerCase();
              var unicode = '\\' + g.unicode[0].charCodeAt(0).toString(16);
              output += `      --lumo-icons-${name}: "${unicode}";\n`;
            });
            output += `    }
  </style>
</custom-style>
`;
            fs.writeFile('font-icons.html', output, function(err) {
              if (err) {
                return console.error(err);
              }
            });

            // Cleanup
            fs.unlink('lumo-icons.woff');
          });
        });
    });
});
