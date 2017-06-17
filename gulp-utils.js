

function gcloudCMD() {
  if (process.env.CIRCLECI) {
    console.log('is circle');
    return 'sudo /opt/google-cloud-sdk/bin/gcloud';
  }
  return 'gcloud';
}

function gcloud(args) {
  return `${gcloudCMD()} ${args}`;
}

module.exports = {
  gcloud
};