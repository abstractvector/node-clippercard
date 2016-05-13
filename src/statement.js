import fs from 'fs'

import PDFParser from 'pdf2json'

class ClipperStatement {

  constructor(buffer, options = {}) {
    if (false === Buffer.isBuffer(buffer)) {
      throw new Error('ClipperStatement must be instantiated with a valid buffer');
    }

    this._rawBuffer = buffer;
    this.activity = undefined;
  }

  getActivity(callback) {
    if (undefined !== this.activity) {
      return callback(null, this.activity);
    }

    var pdf = new PDFParser();
    pdf.parseBuffer(this._rawBuffer);

    pdf.on('pdfParser_dataError', (error) => callback(error));
    pdf.on('pdfParser_dataReady', (result) => this._parse(callback, result));
  }

  _parse(callback, result) {
    var pages = result.formImage.Pages;
    var texts = [];

    var pageNumber = 0;
    for (var page of result.formImage.Pages) {
      pageNumber++;
      for (var t of page.Texts) {
        texts.push({
          p: pageNumber,
          x: t.x,
          y: t.y,
          t: decodeURIComponent(t.R[0].T)
        });
      };
    };

    var yHeader = texts.filter((v) => { return 'TRANSACTION TYPE' === v.t; })[0].y;
    var th = texts.filter((v) => { return yHeader === v.y; }).map((v) => {
      var map = {
        'TRANSACTION TYPE': 'transactionType',
        'LOCATION': 'location',
        'ROUTE': 'route',
        'PRODUCT': 'product',
        'DEBIT': 'debit',
        'CREDIT': 'credit',
        'BALANCE*': 'balance'
      };

      if (undefined !== map[v.t]) {
        return {x: v.x, key: map[v.t]};
      } else {
        return null;
      }
    }).filter((v) => { return null !== v; });
    th.unshift({x: 0, key: 'dateTime'});
    th.sort((a, b) => { return a.x < b.x; });

    var findColumnName = function(x) {
      for (var i of th) {
        if (i.x <= x) {
          return i.key;
        }
      }
    };

    // split the texts into rows
    var rows = {};
    for (var t of texts.filter((v) => { return v.p > 1 || v.y > yHeader; })) {
      if (undefined === rows[t.p + '/' + t.y]) {
        rows[t.p + '/' + t.y] = [];
      }
      rows[t.p + '/' + t.y].push({x: t.x, t: t.t});
    }

    var column, r, activity;
    this.activity = [];
    for (var i in rows) {
      r = rows[i];
      activity = {};
      for (var c of r) {
        activity[findColumnName(c.x)] = c.t;
      }

      if ('undefined' !== typeof activity.dateTime
          && activity.dateTime.search(/[0-9]{2}\/[0-9]{2}\/[0-9]{4} [0-9]{2}:[0-9]{2} (AM|PM)/) > -1) {
        this.activity.push(activity);
      }
    }
    return callback(null, this.activity);
  }

  static fromFile(path, callback, options = {}) {
    if ('function' !== typeof callback) {
      callback = function() {};
    }

    if ('string' !== typeof path) {
      return callback(new Error('Path is required to create statement from file'));
    }

    fs.readFile(path, (error, buffer) => {
      if (error) {
        return callback(error);
      }

      try {
        var statement = new ClipperStatement(buffer, options);
      } catch (e) {
        return callback(e);
      }

      callback(null, statement);
    });
  }

}

export default ClipperStatement
