'use strict';

const Kaltura = require('Kaltura');
const kcopy = require('./');
const retryEntries = require('./retries');
const _ = require('lodash');
const fs = require('fs');

const notFound = './not-found.csv';

function runRety(retries, callback) {
  kcopy.start((err, clients) => {
    var done = _.after(retries.length, function(err) {
      callback(null, 'Done');
    });

    _.forEach(retries, (entry) => {
      var filter = new Kaltura.kc.objects.KalturaBaseEntryFilter();
      filter.idEqual = entry;

      var pager = new Kaltura.kc.objects.KalturaFilterPager();
      pager.pageSize = 500;

      clients.sourceClient.baseEntry.listAction(function(results) {
        if (results && results.code && results.message) {
          fs.appendFileSync(notFound, entry, 'utf8');
          return done();
        } else {
          if (err) return done();

          if (!results) {
            fs.appendFileSync(notFound, entry, 'utf8');
            return done();
          }

          if (results.objects.length === 0) {
            fs.appendFileSync(notFound, entry, 'utf8');
            return done();
          }

          return kcopy.upload(clients.destClient, results, (err, data) => {
            if (err) {
              return done();
            }

            done();
          });
        }
      },
      filter,
      pager);
    });
  });
}

runRety(retryEntries, (err, done) => {
  if (err) throw err;

  console.log(done);
});
