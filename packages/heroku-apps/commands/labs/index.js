'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');
let _   = require('lodash');
let S   = require('string');

function printJSON (features) {
  cli.log(JSON.stringify(features, null, 2));
}

function printFeatures (features) {
  features = _.sortBy(features, 'name');
  let longest = Math.max(...features.map(f => f.name.length));
  for (let f of features) {
    let line = `${f.enabled ? '[+]' : '[ ]'} ${S(f.name).padRight(longest)}`;
    if (f.enabled) line = cli.color.green(line);
    line = `${line}  ${f.description}`;
    cli.log(line);
  }
}

function* run (context, heroku) {
  let features = yield {
    currentUser: heroku.get('/account'),
    user: heroku.get('/account/features'),
    app: context.app ? heroku.get(`/apps/${context.app}/features`) : null,
  };
  // general features are managed via `features` not `labs`
  features.user = features.user.filter(f => f.state !== 'general');
  if (features.app) features.app = features.app.filter(f => f.state !== 'general');
  if (context.flags.json) {
    delete features.currentUser;
    printJSON(features);
  } else {
    cli.styledHeader(`User Features ${cli.color.cyan(features.currentUser.email)}`);
    printFeatures(features.user);
    if (features.app) {
      cli.log();
      cli.styledHeader(`App Features ${cli.color.cyan(context.app)}`);
      printFeatures(features.app);
    }
  }
}

module.exports = {
  topic: 'labs',
  description: 'list experimental features',
  flags: [
    {name: 'json', description: 'display as json'},
  ],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(co.wrap(run))
};