'use strict';
let gulp = require('gulp');
let fs = require('fs');
let path = require('path');
let sourcemaps = require('gulp-sourcemaps');
let typescript = require('gulp-typescript');
let nodemon = require('gulp-nodemon');
let tslint = require('gulp-tslint');
let runSequence = require('run-sequence');
let rimraf = require('rimraf');
let typedoc = require('gulp-typedoc');
let mocha = require('gulp-mocha');
let istanbul = require('gulp-istanbul');
let plumber = require('gulp-plumber');
let remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
let exec = require('child_process').exec;
let argv = require('yargs').argv;
let YAML = require('yamljs');


const CLEAN_BUILD = 'clean:build';
const CLEAN_COVERAGE = 'clean:coverage';
const CLEAN_DOC = 'clean:doc';
const TSLINT = 'tslint';
const COMPILE_TYPESCRIPT = 'compile:typescript';
const COPY_STATIC_FILES = 'copy:static';
const BUILD = 'build';
const GENERATE_DOC = 'generate:doc';
const PRETEST = 'pretest';
const RUN_TESTS = 'run:tests';
const TEST = 'test';
const REMAP_COVERAGE = 'remap:coverage';

const TS_SRC_GLOB = './src/**/*.ts';
const TS_TEST_GLOB = './test/**/*.ts';
const JS_TEST_GLOB = './build/**/*.js';
const JS_SRC_GLOB = './build/**/*.js';
const TS_GLOB = [TS_SRC_GLOB];
const STATIC_FILES = ['./src/**/*.json'];

const tsProject = typescript.createProject('tsconfig.json');

let defaultInfo = require('./src/config/application.json');
let stagingInfo = require('./src/config/application-staging.json');
let productionInfo = require('./src/config/application-production.json');

let environments = [
  defaultInfo,
  stagingInfo,
  productionInfo
];

// Removes the ./build directory with all its content.
gulp.task(CLEAN_BUILD, function(callback) {
  rimraf('./build', callback);
});

// Removes the ./coverage directory with all its content.
gulp.task(CLEAN_COVERAGE, function(callback) {
  rimraf('./coverage', callback);
});

// Removes the ./docs directory with all its content.
gulp.task(CLEAN_DOC, function(callback) {
  rimraf('./docs', callback);
});

// Checks all *.ts-files if they are conform to the rules specified in tslint.json.
gulp.task(TSLINT, function() {
  return gulp.src(TS_GLOB)
    .pipe(tslint({formatter: 'verbose'}))
    .pipe(tslint.report({
      // set this to true, if you want the build process to fail on tslint errors.
      emitError: false
    }));
});

// Compiles all *.ts-files to *.js-files.
gulp.task(COPY_STATIC_FILES, function() {
  return gulp.src(STATIC_FILES)
    .pipe(gulp.dest('build'));
});

gulp.task(COMPILE_TYPESCRIPT, function() {
  return gulp.src(TS_GLOB)
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.', { sourceRoot: '../src' }))
    .pipe(gulp.dest('build'));
});

// Runs all required steps for the build in sequence.
gulp.task(BUILD, function(callback) {
  runSequence(CLEAN_BUILD, TSLINT, COMPILE_TYPESCRIPT, COPY_STATIC_FILES, callback);
});

// Generates a documentation based on the code comments in the *.ts files.
gulp.task(GENERATE_DOC, [CLEAN_DOC], function() {
  return gulp.src(TS_SRC_GLOB)
    .pipe(typedoc({
      out: './docs',
      readme: 'readme.md',
      version: true,
      module: 'commonjs'
    }))
});

// Sets up the istanbul coverage
gulp.task(PRETEST, function() {
  gulp.src(JS_SRC_GLOB)
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire())
});

// Run the tests via mocha and generate a istanbul json report.
gulp.task(RUN_TESTS, function(callback) {
  let mochaError;
  gulp.src(JS_TEST_GLOB)
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function(err) {
      mochaError = err;
    })
    .pipe(istanbul.writeReports({
      reporters: ['json']
    }))
    .on('end', function() {
      callback(mochaError);
    });
});

// Remap Coverage to *.ts-files and generate html, text and json summary
gulp.task(REMAP_COVERAGE, function() {
  return gulp.src('./coverage/coverage-final.json')
    .pipe(remapIstanbul({
      // basePath: '.',
      fail: true,
      reports: {
        'html': './coverage',
        'json': './coverage',
        'text-summary': null,
        'lcovonly': './coverage/lcov.info'
      }
    }))
    .pipe(gulp.dest('coverage'))
    .on('end', function() {
      console.log('--> For a more detailed report, check the ./coverage directory <--')
    });
});

// Runs all required steps for testing in sequence.
gulp.task(TEST, function(callback) {
  runSequence(BUILD, CLEAN_COVERAGE, PRETEST, RUN_TESTS, REMAP_COVERAGE, callback);
});

// Runs the build task and starts the server every time changes are detected.
gulp.task('watch', [BUILD], function() {
  return nodemon({
    ext: 'ts js json',
    script: 'build/server.js',
    watch: ['src/*', 'test/*'],
    tasks: [BUILD]
  });
});

function $exec(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log(stderr);
      }
      resolve(stdout);
    });
  });
}

gulp.task('dbLocalClean', [ 'dbLocalStop' ], (cb) => {
  $exec('docker rm postgres')
    .then(() => $exec('docker rmi -f postgres'))
    .then(() => cb());
});

gulp.task('dbLocalCreateContainer', (cb) => {
  $exec('docker pull postgres')
    .then(() => $exec('docker create --name postgres -p 5432:5432 postgres'))
    .then(() => cb());
});

gulp.task('dbLocalStart', ['dbLocalCreateContainer'], (cb) => {
  $exec('docker start postgres').then(() => cb());
});

gulp.task('dbLocalStop', (cb) => {
  $exec('docker stop postgres').then(() => cb());
});

gulp.task('dbCreateFile', (cb) => {
  $exec(`node ./src/db/migrate.js create ${argv.filename}`).then(() => cb());
});

gulp.task('dbUpdate', (cb) => {
  $exec('node ./src/db/migrate.js migrate').then(() => cb())
});

environments.forEach((config) => {
  console.log('config', config.env);

  if (!config.env) {
    return;
  }

  gulp.task(`makeAppYaml-${config.env}`, (cb) => {

    let json = {
      "runtime": "nodejs",
      "env": "flex",
      "env_variables": {
        "postgres_user": config.postgres.user,
        "postgres_host": config.postgres.host,
        "postgres_port": config.postgres.port,
        "postgres_database": config.postgres.database
      }
    };

    fs.writeFile('./app.yml', YAML.stringify(json), () => {
      cb();
    })
  });
});




