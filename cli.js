const vorpal = require('vorpal')();
const kcopy = require('./index');

vorpal
  .command('deleteEntries', 'List files ascending created at')
  .option('-s, --source <sourceClient or destClient>', 'Which client source')
  .option('-d, --dest <sourceClient or destClient>', 'Which client destination')
  .option('-b, --begin <beginning epoch time>', 'Beginning epoch created at time')
  .option('-e, --end <ending epoch time>', 'Ending epoch created at time')
  .option('-t, --interval <epoch time interval>', 'Interval between created at times')
  .option('-o, --orderby <createdAtAsc or createdAtDesc>', 'Order created at')
  .option('-i, --pageIndex <int>', 'Which page')
  .option('-z, --pageSize <int>', 'Number of results per page')
  .action(function(args, callback) {
    kcopy.deleteEntries(args.options, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('findById', 'Find media entry by id')
  .option('-c, --client <sourceClient or destClient>', 'Source or Destination client to search')
  .option('-i, --id <string>', 'The id to search for entry')
  .action(function(args, callback) {
    const {client, id} = args.options;
    kcopy.findById(client, id, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('findByName', 'Find media entry by name')
  .option('-c, --client <sourceClient or destClient>', 'Source or Destination client to search')
  .option('-n, --name <string>', 'The name of the entry')
  .action(function(args, callback) {
    const {client, name} = args.options;
    kcopy.findByName(client, name, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('listAsc', 'List files ascending created at')
  .option('-c, --client <sourceClient or destClient>', 'Which client ')
  .option('-n, --pagenumber <int>', 'Which page')
  .option('-r, --returned <int>', 'How many returned')
  .action(function(args, callback) {
    console.log(args)
    const { client, returned, pagenumber } = args.options;
    kcopy.listAsc(client, returned, pagenumber, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('listDesc', 'List files ascending created at')
  .option('-c, --client <sourceClient or destClient>', 'Which client ')
  .option('-n, --pagenumber <int>', 'Which page')
  .option('-r, --returned <int>', 'How many returned')
  .action(function(args, callback) {
    const { client, returned, pagenumber } = args.options;
    kcopy.listDesc(client, returned, pagenumber, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('listEntries', 'List files ascending created at')
  .option('-s, --source <sourceClient or destClient>', 'Which client source')
  .option('-d, --dest <sourceClient or destClient>', 'Which client destination')
  .option('-b, --begin <beginning epoch time>', 'Beginning epoch created at time')
  .option('-e, --end <ending epoch time>', 'Ending epoch created at time')
  .option('-t, --interval <epoch time interval>', 'Interval between created at times')
  .option('-o, --orderby <createdAtAsc or createdAtDesc>', 'Order created at')
  .option('-i, --pageIndex <int>', 'Which page')
  .option('-z, --pageSize <int>', 'Number of results per page')
  .action(function(args, callback) {
    kcopy.listEntries(args.options, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('namesExist', 'List files ascending created at')
  .option('-s, --start <int>', 'Start time in Unix Epoch seconds')
  .option('-e, --end <int>', 'End time in Unix Epoch seconds')
  .option('-i, --interval <int>', 'Interval between begining and ending time in seconds')
  .action(function(args, callback) {
    const { start, end, interval } = args.options;
    kcopy.namesExist(start, end, interval, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('printAll', 'List files ascending created at')
  .option('-s, --start <int>', 'Start time in Unix Epoch seconds')
  .option('-e, --end <int>', 'End time in Unix Epoch seconds')
  .option('-i, --interval <int>', 'Interval between begining and ending time in seconds')
  .action(function(args, callback) {
    const { start, end, interval } = args.options;
    kcopy.printAll(start, end, interval, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .command('uploadByInterval', 'List files ascending created at')
  .option('-s, --start <int>', 'Start time in Unix Epoch seconds')
  .option('-e, --end <int>', 'End time in Unix Epoch seconds')
  .option('-i, --interval <int>', 'Interval between begining and ending time in seconds')
  .action(function(args, callback) {
    const { start, end, interval } = args.options;
    kcopy.uploadByInterval(start, end, interval, (err, done) => {
      if (err) {
        console.log(err);
        return callback();
      }

      console.log(done)
      return callback();
    });
  });

vorpal
  .delimiter('Kaltura Copy $')
  .show();
