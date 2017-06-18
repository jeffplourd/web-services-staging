'use strict';
let _ = require('lodash');
let utils = require('./gulp-utils');
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
let replace = require('gulp-replace-task');
let rename = require('gulp-rename');

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

const VERSION = require('./package.json').version;

const gcloud = {
  dbBucket: 'database-scripts-jeff',
  dbAppBucket: 'web-services',
  domain: 'us.gcr.io',
  projectId: 'web-services-staging',
  clusterId: 'web-services',
  zoneId: 'us-central1-a',
  serviceKey: process.env.GCLOUD_SERVICE_KEY || 'serviceKey',
  imageVersion: process.env.CIRCLE_SHA1 || 'imageVersion',
  branch: process.env.CIRCLE_BRANCH || argv.env || 'branch',
};

gcloud.uri = `${gcloud.domain}/${gcloud.projectId}/`;
gcloud.dbScripts = `gs://${gcloud.dbBucket}/${gcloud.dbAppBucket}/${VERSION}`;
gcloud.imageName = `${gcloud.clusterId}-${gcloud.branch}`;
gcloud.image = `${gcloud.uri}${gcloud.imageName}:${gcloud.imageVersion}`;

const env = {
  NODE_ENV: gcloud.branch || 'default',
  NODE_CONFIG_DIR: './build/config'
};

function $exec(cmd, options = {}) {

  options['env'] = _.assign({}, process.env, options.env || {});

  return new Promise((resolve, reject) => {
    let child = exec(cmd, options, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      }
      resolve(stdout);
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

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
    tasks: [BUILD],
    env
  });
});

gulp.task('serve', [ BUILD ], (cb) => {

  console.log('env', env);

  function serve(cb) {
    $exec('node build/server.js', { env }).then(() => cb());
  }

  if (env.NODE_ENV === 'default') {
    runSequence('dbUpdate', () => serve(cb));
  }
  else {
    serve(cb);
  }
});

gulp.task('dbLocalClean', [ 'dbLocalStop' ], (cb) => {
  $exec('docker rm postgres')
    .then(() => $exec('docker rmi -f postgres'))
    .then(() => cb());
});

gulp.task('dbLocalCreateContainer', (cb) => {
  $exec('docker pull postgres')
    .then(() => $exec('docker create --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres'))
    .then(() => cb())
    .catch(() => cb());
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

function dbMigrate(success, fails = 0) {
  $exec('node ./build/db/migrate.js', { env })
    .then((stdout) => {
      success(stdout);
    })
    .catch((stderr) => {
      fails++;
      if (fails < 5) {
        setTimeout(() => dbMigrate(success, fails), 2500);
      }
      else {
        throw Error(stderr);
      }
    });
}

gulp.task('dbUpdate', (cb) => {
  if (env.NODE_ENV === 'default') {
    runSequence(BUILD, 'dbLocalStart', () => dbMigrate(() => cb()));
  }
  else {
    runSequence(BUILD, () => dbMigrate(() => cb()));
  }
});

gulp.task('psql', (cb) => {
  $exec(`
    psql "sslmode=verify-full sslrootcert=certs/server-ca.pem \
          sslcert=certs/client-cert.pem sslkey=certs/client-key.pem \
          hostaddr=104.154.139.93 \
          host=web-services-staging:web-services-staging-db \
          port=5432 \
          user=postgres dbname=postgres"
  `).then(() => cb());
});

gulp.task('dbPublish', (cb) => {
  $exec(`gsutil rsync -r -d -c src/db ${gcloud.dbScripts}`).then(() => cb())
});

gulp.task('dockerBuild', (cb) => {
  if (env.NODE_ENV === 'default') {
    return;
  }

  $exec(`docker build -f dockerfiles/Dockerfile.${gcloud.branch} -t ${gcloud.image} .`)
    .then(() => cb());
});

gulp.task('pushDocker', (cb) => {
  $exec(utils.gcloud(`docker -- push ${gcloud.image}`)).then(() => cb());
});

gulp.task('dockerRun', (cb) => {
  if (env.NODE_ENV === 'default') {
    return;
  }

  $exec(`docker create --name=web-services-${env.NODE_ENV} -p 3000:3000 web-services-${env.NODE_ENV}`)
    .then(() => $exec(`docker start web-services-${env.NODE_ENV}`))
    .then(() => cb());
});

gulp.task('testReplace', () => {

  gulp.src('./deployment/deployment-temp.yml')
    .pipe(replace({
      patterns: [
        { match: 'testy', replacement: 'myreplacement' }
      ]
    }))
    .pipe(gulp.dest('replaced.yml'));
});

function createPattern(obj) {
  const result = [];
  _.forEach(obj, (value, key) => {
    console.log('value', value, 'key', key);
    result.push({
      match: key,
      replacement: value
    });
  });
  return result;
}

gulp.task('kubectlCreateDeplConfig', () => {

  const patterns = createPattern({
    deployName: `${gcloud.clusterId}-deployment`,
    replicas: 1,
    image: gcloud.image
  });

  gulp.src('./deployment/kubernetes-deployment-template.yml')
    .pipe(replace({ patterns }))
    .pipe(rename('kubernetes-deployment.yml'))
    .pipe(gulp.dest('./deployment'));
});

gulp.task('kubectlCreateServiceConfig', () => {

  const patterns = createPattern({
    imageName: gcloud.imageName
  });

  gulp.src('./deployment/kubernetes-service-template.yml')
    .pipe(replace({ patterns }))
    .pipe(rename('kubernetes-service.yml'))
    .pipe(gulp.dest('./deployment'));
});

gulp.task('testTask', (cb) => {
  console.log('env', env);
  console.log('process.env', process.env);
  $exec(utils.gcloud('info')).then(() => cb());
});

gulp.task('gcloudUpdate', (cb) => {
  $exec(utils.gcloud('--quiet components update'))
    .then(() => cb());
});

gulp.task('kubeUpdate', ['gcloudUpdate'], (cb) => {
  $exec(utils.gcloud('--quiet components update kubectl')).then(() => cb());
});

gulp.task('createServiceKeyFromEncryption', (cb) => {
  $exec(`echo ${gcloud.serviceKey} | base64 --decode -i > ./gcloud-service-key.json`)
    .then(() => cb());
});

gulp.task('gcloudAuthServiceAccount', (cb) => {
  $exec(utils.gcloud('auth activate-service-account --key-file ./gcloud-service-key.json'))
    .then(() => cb());
});

gulp.task('gcloudConfig', (cb) => {
  $exec(utils.gcloud(`config set project ${gcloud.projectId}`))
    .then(() => $exec(utils.gcloud(`--quiet config set container/cluster ${gcloud.clusterId}`)))
    .then(() => $exec(utils.gcloud(`config set compute/zone ${gcloud.zoneId}`)))
    .then(() => $exec(utils.gcloud(`--quiet container clusters get-credentials ${gcloud.clusterId}`)))
    .then(() => $exec('sudo chown -R $USER /home/ubuntu/.config'))
    .then(() => $exec('sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube'))
    .then(() => cb());
});

gulp.task('kubeDeployDeployment', (cb) => {
  $exec('kubectl apply -f ./deployment/kubernetes-deployment.yml').then(() => cb());
});

gulp.task('')

