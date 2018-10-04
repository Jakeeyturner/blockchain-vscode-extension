#!/bin/bash

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#-- script to auto publish plugin to VSCode marketplace
# Exit on first error, print all commands.
set -ev
set -o pipefail

if [ "${TASK}" != "systest" ]; then
    exit 0
fi

# Grab the current root directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd ${DIR}/client

# check that this is the right node.js version
if [ "${TRAVIS_NODE_VERSION}" != "" -a "${TRAVIS_NODE_VERSION}" != "8" ]; then
  echo Not executing as not running primary node.js version
  exit -1
fi

# Check that this is the main repository.
if [[ "${TRAVIS_REPO_SLUG}" != Jakeeyturner* ]]; then
  echo "Skipping deploy; wrong repository slug."
  exit -1
fi

# Push the code to npm there there is a travis tag defined
if [ "${TRAVIS_TAG}" != "" ]; then


  # publish to the VSCode marketplace using VSCETOKEN
#   echo "THIS IS WHERE VSCE PUBLISH -P TOKEN WOULD OCCUR"
#   insert shit here
#   exit -1

  # We will need the node modules installed before publishing
  #   npm install
  #   vsce publish -p ${VSCETOKEN}

  # Configure the Git repository and clean any untracked and unignored build files.
  npm install -g @alrra/travis-scripts
  set-up-ssh --key "$encrypted_43285c67a7b0_key" \
                             --iv "$encrypted_43285c67a7b0_iv" \
                             --path-encrypted-key "../.travis/github_deploy_key.enc"

  git config user.name "${GH_USER_NAME}"
  git config user.email "${GH_USER_EMAIL}"
  git checkout -b issue-16
  git reset --hard
  git clean -d -f

  npm install semver

  # Bump the version number.
  node ./scripts/pkgbump.js

  export NEW_VERSION=$(node -e "console.log(require('./package.json').version)")

# Change from HTTPS to SSH.
  ../.travis/fix_github_https_repo.sh

  # Add the version number changes and push them to Git.
  git add .
  git commit -m "Automatic version bump to ${NEW_VERSION}"
  git push origin issue-16

fi

echo Successfully published the new version
