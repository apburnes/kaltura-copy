const Kaltura = require('Kaltura');
const _ = require('lodash');
const fs = require('fs');
const format = require('date-fns/format');

const startTime = format(Date.now(),'YYYYMMDDHHmmss');
const deleteFile = `./delete-${startTime}.csv`;
const successFile = `./success-${startTime}.csv`;
const errorFile = `./error-${startTime}.csv`;

const sourceSecret = process.env.SOURCE_PARTNER_SECRET;
const sourcePartnerId = process.env.SOURCE_PARTNER_ID;
const destSecret = process.env.DEST_PARTNER_SECRET;
const destPartnerId = process.env.DEST_PARTNER_ID;

function epochReadable(e) {
  return format(e*1000,'YYYY-MM-DD HH:MM');
}

function checkNames(client,results,callback) {
  if (!results) return callback('Error results undefined');

  if (results.objects.length === 0) return callback(null, 'No results available');

  var items = results.objects;
  var done = _.after(items.length, function(err) {
    callback(err, 'Finished checking names');
  });

  _.forEach(items, function(item) {
    getName(client, item.name, (err, res) => {
      if (err) return callback(err);
      if (!res) return callback(new Error('Results return null'))
      if (res.totalCount > 1) console.log(`${item.name} occurs ${res.totalCount} times.`);
      if (res.totalCount === 0) console.log(`${item.name} new item`);
      return done();
    });
  });
}

function createIntervals(func) {
  return function createInterval(options = {}, callback) {
    source = options.source || 'sourceClient';
    dest = options.dest || 'destClient';
    begin = options.begin || 1491430424;
    end = options.end || nowEpoch();
    interval = options.interval || 21600;
    orderby = options.orderby || 'createdAtAsc';
    pageIndex = options.pageIndex || 1;
    pageSize = options.pageSize || 500;

    if (begin >= end) {
      return callback(null, 'done');
    }

    if (source !== 'sourceClient' && source !== 'destClient') {
      return callback(new Error('The source must be set to "sourceClient" or "destClient"'));
    }

    if (dest !== 'sourceClient' && dest !== 'destClient') {
      return callback(new Error('The dest must be set to "sourceClient" or "destClient"'));
    }

    const intervalLength = begin + interval;
    const intervalEnd = intervalLength < end ? intervalLength : end;
    const timeinterval = {begin, end: intervalEnd};
    const greaterDate = epochReadable(begin);
    const lessDate = epochReadable(intervalEnd);
    console.log(`Range ${greaterDate} to ${lessDate}`);

    start((err, clients) => {
      const { sourceClient, destClient } = clients;
      const funcOpts = {
        source: clients[source],
        dest: clients[dest],
        begin,
        end: intervalEnd,
        interval,
        orderby,
        pageIndex,
        pageSize
      }

      func(funcOpts, (err, done) => {
        if (err) return callback(err);

        createInterval({
          source,
          dest,
          begin: intervalEnd,
          end,
          interval,
          orderby,
          pageIndex,
          pageSize
        }, callback);
      });
    });
  }
}

function entriesDelete(client, entries, callback) {
  if (!entries) {
    return callback(null, entries);
  }

  if (entries.totalCount === 0) {
    return callback(null, 'no results returned');
  }

  console.log('Total Results Listed: ' + entries.objects.length);
  var items = entries.objects;
  var done = _.after(items.length, function(err) {
    callback(err, 'done');
  });

  _.forEach(items, function(item) {
    if (!item.id) {
      return done();
    }

    client.media.deleteAction(function(response) {
      if (!response) {
        const missed = `${item.id}\n`;
        fs.appendFileSync(deleteFile, missed, 'utf8');
        return done();
      } else if (response && response.code && response.message) {
        console.log('Upload Error: '+item.id);
        fs.appendFileSync(errorFile, `${item.id}\n`, 'utf8');
        return done();
      } else {
        const entry = `${item.id}\n`;
        fs.appendFileSync(deleteFile, entry, 'utf8');
        return done();
      }
    },
    item.id);
  });
}

function getName(client,name,callback) {
  var filter = new Kaltura.kc.objects.KalturaBaseEntryFilter();
  filter.nameEqual = name;

  var pager = new Kaltura.kc.objects.KalturaFilterPager();
  pager.pageSize = 500;

  client.baseEntry.listAction(function(results) {
    if (results && results.code && results.message) {
      callback('Kaltura Get Name Error: ' + results);
    } else {
      callback(null, results)
    }
  },
  filter,
  pager);
}

function list(
  client,
  pageSize = 10,
  pageIndex = 1,
  orderby = 'createdAtAsc',
  timeinterval = {begin: 1491430424, end: nowEpoch()},
  callback
  ) {
    var orderbyfilters = {
      createdAtAsc: Kaltura.kc.enums.KalturaBaseEntryOrderBy.CREATED_AT_ASC,
      createdAtDesc: Kaltura.kc.enums.KalturaBaseEntryOrderBy.CREATED_AT_DESC
    };

    var filter = new Kaltura.kc.objects.KalturaBaseEntryFilter();
    filter.orderBy = orderbyfilters[orderby];
    filter.createdAtGreaterThanOrEqual = timeinterval.begin;
    filter.createdAtLessThanOrEqual = timeinterval.end;

    var pager = new Kaltura.kc.objects.KalturaFilterPager();
    pager.pageSize = pageSize || 10;
    pager.pageIndex = pageIndex || 0;

    client.baseEntry.listAction(function(results) {
      if (results && results.code && results.message) {
        callback('Kaltura Error' + results);
      } else {
        callback(null, results)
      }
    },
    filter,
    pager);
}

function listRecursively(func) {
  return function recursive(options = {}, callback) {
    const source = options.source;
    const dest = options.dest;
    const begin = options.begin || 1491430424;
    const end = options.end || nowEpoch();
    const interval = options.interval || 21600;
    const orderby = options.orderby || 'createdAtAsc';
    const pageIndex = options.pageIndex || 1;
    const pageSize = options.pageSize || 500;

    if(!source) return callback(new Error('Source client not defined'));
    if(!dest) return callback(new Error('Dest client not defined'));

    list(source, pageSize, pageIndex, orderby, {begin, end}, function(err, results) {
      if (err) return callback(err);

      if (!results) return callback(null, 'done');

      if (pageIndex === 1) console.log('Total Records: '+results.totalCount);

      if (results.totalCount === 0) {
        return callback(null, 'no results');
      }

      if (results.objects.length === 0) {
        return callback(null, 'No objects left');
      }

      if (pageIndex === 80) {
        return callback(null, 'stop short');
      }

      func(dest, results, function(err, done) {
        if (err) return callback(err);
        console.log('Page Number: '+pageIndex);
        pagePlus = pageIndex + 1;

        const recursiveOptions = {
          source,
          dest,
          begin,
          end,
          interval,
          orderby,
          pageIndex: pagePlus,
          pageSize
        };

        recursive(recursiveOptions, callback)
      });
    });
  }
}

function upload(client, data, callback) {
  if (!data) {
    return callback(null, data);
  }

  if (data.totalCount === 0) {
    return callback(null, 'no results returned');
  }

  console.log('Total Results Listed: ' + data.objects.length);
  var items = data.objects;
  var done = _.after(items.length, function(err) {
    callback(err, 'done');
  });

  _.forEach(items, function(item) {
    var mediaEntry = new Kaltura.kc.objects.KalturaMediaEntry();
    mediaEntry.name = item.name;
    mediaEntry.description = item.description;
    mediaEntry.tags = item.tags;
    mediaEntry.categories = item.categories;
    mediaEntry.mediaType = Kaltura.kc.enums.KalturaMediaType.VIDEO;
    var url = item.downloadUrl;

    client.media.addFromUrl(function(response) {
      if (!response) {
        const missed = `${item.id},no_id_returned\n`;
        fs.appendFileSync(successFile, missed, 'utf8');
        return done();
      } else if (response && response.code && response.message) {
        console.log('Upload Error: '+item.id);
        fs.appendFileSync(errorFile, `${item.id}\n`, 'utf8');
        return done();
      } else {
        const entry = `${item.id},${response.id}\n`;
        fs.appendFileSync(successFile, entry, 'utf8');
        return done();
      }
    },
    mediaEntry,
    url);
  });
}

function startSession(partnerId, secret, callback) {
  var config = new Kaltura.kc.KalturaConfiguration(partnerId);
  config.serviceUrl = 'https://www.kaltura.com';

  var client = new Kaltura.kc.KalturaClient(config);
  client.session.start(function(ks) {
    if (ks.code && ks.message) {
      return callback('Error starting session'+ks);
    } else {
      client.setKs(ks);

      callback(null, client)
    }
  },
  secret,
  "",
  Kaltura.kc.enums.KalturaSessionType.ADMIN,
  partnerId);
}

function nowEpoch () {
  var n = new Date().getTime() / 1000;
  return Math.ceil(n)
}

function runThroughTime(start = 1491430424, end = nowEpoch(), interval = 21600, callback) {
  if (start >= end) {
    return callback(null, 'done');
  }

  const current = end;
  const timeinterval = {start, end: start + interval};

  start((err, clients) => {
    const { sourceClient, destClient } = clients;
    recurse(sourceClient, destClient, 1, timeinterval, (err, done) => {
      if (err) return callback(err);

      runThroughTime(timeinterval.end, current, interval, (err, done) => {
        if (err) return callback(err);

        return callback(null, done);
      });
    });
  });
}

function recurse(sourceClient, destClient, pageIndex = 1, timeinterval, callback) {
  list(sourceClient, 500, pageIndex, undefined, timeinterval, function(err, results) {
    console.log('Page Number: '+pageIndex);

    if (err) throw err;

    if (!results) {
      return callback(null, 'done');
    }

    if (results.totalCount === 0) {
      return callback(null, 'no results');
    }

    if (pageIndex === 80) {
      return callback(null, 'stop short');
    }

    upload(destClient, results, function(err, done) {
      if (err) throw err;
      pagePlus = pageIndex + 1;

      recurse(sourceClient, destClient, pagePlus, timeinterval, callback)
    });
  });
}

function printStats(client, results, callback) {
  if (!results) {
    console.log('No results');
    return callback(null,'done')
  };

  console.log('Records Retrieved: '+results.objects.length);
  return callback(null,null);
}

function runIntervals(func) {
  return function getInterval(begin = 1491430424, end = nowEpoch(), interval = 21600, callback) {
    if (begin >= end) {
      return callback(null, 'done');
    }

    const intervalLength = begin + interval;
    const intervalEnd = intervalLength < end ? intervalLength : end;
    const timeinterval = {begin, end: intervalEnd};
    const greaterDate = epochReadable(begin);
    const lessDate = epochReadable(intervalEnd);
    console.log(`Range ${greaterDate} to ${lessDate}`);

    start((err, clients) => {
      const { sourceClient, destClient } = clients;
      func(sourceClient, destClient, 1, timeinterval, (err, done) => {
        if (err) return callback(err);

        getInterval(timeinterval.end, end, interval, callback);
      });
    });
  }
}

function recurseList(func) {
  return function recursor(sourceClient, destClient, pageIndex = 1, timeinterval, callback) {
    list(sourceClient, 500, pageIndex, undefined, timeinterval, function(err, results) {
      if (err) return callback(err);

      if (!results) return callback(null, 'done');

      if (pageIndex === 1) console.log('Total Records: '+results.totalCount);

      if (results.totalCount === 0) {
        return callback(null, 'no results');
      }

      if (results.objects.length === 0) {
        return callback(null, 'No objects left');
      }

      if (pageIndex === 80) {
        return callback(null, 'stop short');
      }

      func(destClient, results, function(err, done) {
        if (err) return callback(err);
        console.log('Page Number: '+pageIndex);
        pagePlus = pageIndex + 1;

        recursor(sourceClient, destClient, pagePlus, timeinterval, callback)
      });
    });
  }
}

function start(callback) {
  startSession(sourcePartnerId, sourceSecret, function(err, sourceClient) {
    if (err) return callback(err);
    startSession(destPartnerId, destSecret, function(err, destClient) {
      if (err) return callback(err);
      return callback(null, {sourceClient, destClient});
    });
  });
}

function listAsc(which = 'sourceClient', pageSize = 10, pageIndex = 1, callback) {
  start((err, clients) => {
    const client = clients[which];

    list(client, pageSize, pageIndex, 'createdAtAsc', undefined, (err, results) => callback(err, results));
  });
}

function listDesc(which = 'sourceClient', pageSize = 10, pageIndex = 1, callback) {
  start((err, clients) => {
    const client = clients[which];

    list(client, pageSize, pageIndex, 'createdAtDesc', undefined, (err, results) => callback(err, results));
  });
}

function findById(clientName = 'sourceClient', id, callback) {
  start((err, clients) => {
    const client = clients[clientName];
    var filter = new Kaltura.kc.objects.KalturaBaseEntryFilter();
    filter.idEqual = id;

    var pager = new Kaltura.kc.objects.KalturaFilterPager();
    pager.pageSize = 500;

    client.baseEntry.listAction(function(results) {
      if (results && results.code && results.message) {
        callback('Kaltura Get Name Error: ' + results);
      } else {
        callback(null, results)
      }
    },
    filter,
    pager);
  });
}

function findByName(clientName = 'sourceClient', name, callback) {
  start((err, clients) => {
    const client = clients[clientName];
    getName(client, name, callback);
  });
}

const printAll = runIntervals(recurseList(printStats));
const namesExist = runIntervals(recurseList(checkNames));
const uploadByInterval = runIntervals(recurseList(upload));
const listEntries = createIntervals(listRecursively(printStats));
const deleteEntries = createIntervals(listRecursively(entriesDelete));

module.exports = {
  deleteEntries: deleteEntries,
  findById: findById,
  findByName: findByName,
  listAsc: listAsc,
  listDesc: listDesc,
  listEntries: listEntries,
  namesExist: namesExist,
  printAll: printAll,
  start: start,
  upload: upload,
  uploadByInterval: uploadByInterval
};
