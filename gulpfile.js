"use strict";

var gulp = require("gulp"); /* Подключаем gulp, функцией require в node.js*/
var del = require("del");
var plumber = require("gulp-plumber"); /* Подключаем инструмент для вывода ошибок в
нормальную форму при преобразовании процессорного файла в css */
var sourcemap = require("gulp-sourcemaps"); /* Подключаем для просмотра исходного файла в инструментах разработчика
в браузере */
var less = require("gulp-less"); /* Подключаем установленную через npm i gulp-less */
var postcss = require("gulp-postcss"); /* Подключаем post-css для работы с css файлом */
var autoprefixer = require("autoprefixer"); /* Подключаем автопрефиксер для postcss префиксы для старых браузеров */
var server = require("browser-sync").create(); /* Запускаем локальный сервер с помощью browser-sync */
var csso = require("gulp-csso"); /* Подключаем минимизатор для CSS */
var htmlmin = require("gulp-htmlmin"); /* Подключаем минимизатор HTML */
var rename = require("gulp-rename"); /* Подключаем gulp-rename для переименование файлов */
var imagemin = require("gulp-imagemin"); /* Подключаем плагин gulp-imagemin */
var webp = require("gulp-webp"); /* Подключаем webp оптимизатор */
var svgstore = require("gulp-svgstore"); /* Подключаем собиратель svg-спрайтов */
var posthtml = require("gulp-posthtml"); /* Вставка svg-спрайтов в html */
var include = require("posthtml-include"); /* Добавляем плагин для posthtm для вставки svg-спрайта
в определенное место html-документа */

gulp.task("css", function () { /* конвертация препроцессорного кода и минификация CSS */
  return gulp.src("source/less/style.less") /* Берем контент style.less */
    .pipe(plumber()) /* Запускаем plumber */
    .pipe(sourcemap.init())
    .pipe(less()) /* Преобразовываем less в css */
    .pipe(postcss([ /* Запускаем postcss с внутренним автопрефиксиром */
      autoprefixer()
    ]))
    .pipe(csso()) /* Минимизатор CSS после всех преобразований */
    .pipe(rename("style.min.css")) /* Переименовываем файл после минимизации */
    .pipe(sourcemap.write(".")) /* Записываем все изменения для отображения в инструментах разработчика */
    .pipe(gulp.dest("build/css")) /* Сохраняем получившийся контент в папку css */
});

gulp.task("server", function () { /* Запускаем сервер и слежение за изменением файлов */
  server.init({ /* Запускаем сервер */
    server: "build/", /* Определяем папку корень для нашего сайта */
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
/*  Вотчеры для слежения ... */
  gulp.watch("source/less/**/*.less", gulp.series("css", "refresh")); /* ...за .less в любой подпапке и при изменении запусти gulp */
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh")); /* При добавлении svg-файла создаем спрайт и прогоняем posthtml */
  gulp.watch("source/*.html", gulp.series("html", "refresh")); /*  ... за .html файлами и прогони posthtml */
});

gulp.task("images", function () { /* Оптимизируем изображение */
  return gulp.src("source/img/**/*.{png,jpg,svg}") /* Описываем контент с которым будем работать */
    .pipe(imagemin([
      imagemin.mozjpeg({quality: 100, progressive: true}) /* Оптимизируем изображение сжатием 1-7 с кол-во прогонов от 1-240 */
    ]))
    .pipe(gulp.dest("build/img")); /* Сохраняем получившийся контент в папку img */
});

gulp.task("webp", function () { /* Конвертируем jpeg, png в webp */
  return gulp.src("source/img/**/*.{png, jpg}")
    .pipe(webp({quality: 90})) /* Устанавливаем необходимое качество сжатия */
    .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () { /* Собираем спрайт из файлов icon-... */
  return gulp.src("source/img/icon-*.svg")
    .pipe(svgstore({ /* Передаем выбранные svg в svgstore */
      inLineSvg: true /* Сообщаем о том, что будем инлайнить в html файл */
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img")); /* В папку build складываем */
});

gulp.task("html", function () { /* Вставляем спрайт в html файл */
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({ collapseWhitespace: true })) /* Минимизатор HTML */
    /*.pipe(rename(function (path) {
        path.basename += ".min";
    }))
    .pipe(rename({
     suffix: "-min"
    }))*/
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function () { /* Очищаем папку build */
  return del("build");
});

gulp.task("copy", function () { /* Копируем файлы в отдельную папку build */
  return gulp.src([
    "source/fonts/**/*.{woff, woff2}",
    "source/img/**",
    "source/js/**",
    "source/*.ico"
  ], {
    base: "source" /* Укажем корень для копирования папку source с подпапками */
  })
  .pipe(gulp.dest("build"));
});

gulp.task("build", gulp.series( /* Команда build */
  "clean",
  "copy",
  "css",
  "sprite",
  "html"
));

gulp.task("start", gulp.series("build", "server")); /* Добавляем команду для последовательного
запуска gulp build, затем gulp server командой gulp.series*/

gulp.task("refresh", function (done) { /* Перезапуск локального сервера */
  server.reload();
  done();
});
