var autoprefixer   = require('autoprefixer'),
    browserSync    = require('browser-sync'),
    mqpacker       = require('css-mqpacker'),
    sortCSSmq      = require('sort-css-media-queries'),
    cssnano        = require('cssnano'),
    del            = require('del'),
    gulp           = require('gulp'),
    imagemin       = require('gulp-imagemin'),
    mozjpeg        = require('imagemin-mozjpeg'),
    pngquant       = require('imagemin-pngquant'),
    plumber        = require('gulp-plumber'),
    postcss        = require('gulp-postcss'),
    rename         = require('gulp-rename'),
    concat         = require('gulp-concat'),
    uglify         = require('gulp-uglify'),
    sass           = require('gulp-sass'),
    svgmin         = require('gulp-svgmin'),
    svgstore       = require('gulp-svgstore'),
    assets         = require('postcss-assets'),
    flexbugsFixes  = require('postcss-flexbugs-fixes'),
    runSequence    = require('run-sequence'),
    spritesmith    = require('gulp.spritesmith');

gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    },
    notify: false
  });
});

gulp.task('style', function() {
  return gulp.src('app/sass/style.sass')
    .pipe(plumber())    //отслеживание ошибок
    .pipe(sass())
    .pipe(postcss([
      assets(),         //картинки в base64 (background: inline('img.png')). Ширина картинки - width: width('img.png')
      flexbugsFixes(),
      autoprefixer({
        browsers: ['last 15 version']
      }),
      mqpacker({        //сортировка медиа
        sort: sortCSSmq
      }),
      cssnano()
    ]))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('libscss', function() {
  return gulp.src('app/libs/css/*.css')
    .pipe(plumber())
    .pipe(concat('libs.css'))
    .pipe(postcss([
      cssnano()
    ]))
    .pipe(gulp.dest('app/libs'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('script', function() {
  return gulp.src(['app/js/*.js', '!app/js/script.js'])
    .pipe(plumber())
    .pipe(concat('script.js'))
    .pipe(uglify())
    .pipe(gulp.dest('app/js'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('libsjs', function() {
  return gulp.src('app/libs/js/*.js')
    .pipe(plumber())
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest('app/libs'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('imagemin', function() {
  return gulp.src('app/img/**/*.{png,jpg}')
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      pngquant({
        quality: '85-100'
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      mozjpeg({
        progressive: true,
        quality: '90'
      })
    ]))
    .pipe(gulp.dest('build/img'));
});

gulp.task('symbols', function() {
  return gulp.src('app/img/svg/*.svg')
    .pipe(svgmin({}))
    .pipe(svgstore({      //конкатенация в спрайт с помощью <symbol>
      inlineSvg: true     //для использований инлайново. Вырежет лишнее из свг (доктайп и прочее)
    }))
    .pipe(rename('symbols.svg'))
    .pipe(gulp.dest('app/img'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('watch', ['style', 'script', 'libscss', 'libsjs', 'symbols', 'browserSync'], function() {
  gulp.watch('app/sass/**/*.sass', ['style']);
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/js/*.js', ['script']);
  gulp.watch('app/libs/js/*.js', ['libsjs']);
  gulp.watch('app/libs/css/*.css', ['libscss']);
  gulp.watch('app/img/svg/*.svg', ['symbols']);
});

gulp.task('clean', function() {
  return del('build');
});

gulp.task('copy', function() {
  gulp.src([
      'app/css/style.css',
      'app/fonts/**/*.{woff,woff2,ttf}',
      'app/img/symbols.svg',
      'app/js/script.js',
      'app/libs/libs.css',
      'app/libs/libs.js',
      'app/*.html'
    ], {
      base: 'app'		//чтоб создавались папки, а не просто все сваливалось в кучу. Если брать из корневой директории -- ставится .
    })
    .pipe(gulp.dest('build'));
  gulp.src('app/fav/**.*')
    .pipe(gulp.dest('build'));
});


gulp.task('build', function(callback) {
  runSequence('clean',
    'libscss',
    'libsjs',
    'style',
    'script',
    'symbols',
    'imagemin',
    'copy',
    callback);		//галп передает функцию для завершения работы таска
});


gulp.task('sprite', function() {
    var spriteData =
        gulp.src('app/img/sprite/*.png')
            .pipe(spritesmith({
              //retinaSrcFilter: ['app/img/sprite/*@2x.png'],
                imgName: 'sprite.png',
                //retinaImgName: 'sprite@2x.png',
                cssName: 'sprite.css',
                padding: 10,
            }));

    spriteData.img.pipe(gulp.dest('app/img/'));
    spriteData.css.pipe(gulp.dest('app/img/'));
});
