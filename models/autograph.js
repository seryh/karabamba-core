/*
* Example model
*/

autographModel = function (dbConnection, phpTimeZone) {
    require("date");

    var util = require('util'),
        time = require('time'),
        moment = require('moment');

    var autograph = {};
    phpTimeZone = (typeof phpTimeZone != 'undefined') ? phpTimeZone : 'Asia/Novosibirsk';
    autograph.util = require('util');
    autograph.time = time;
    autograph.dbConnection = dbConnection;
    autograph.timeZone = phpTimeZone;

    var _tmp = new Date();
    time.extend(_tmp);
    _tmp.setTimezone(autograph.timeZone);
    autograph.timeZoneOffset = (_tmp.getTimezoneOffset()*60) * (-1);

    var _addISOdate = function (dataArray, timezone) {
        timezone = (typeof timezone != 'undefined') ? timezone : 'Asia/Novosibirsk';
        dataArray.forEach(function (item) {
            var timePoint = new Date(item.Time * 1000);
            item.TimeUTC = timePoint.toISOString();           // require("date")

            time.extend(timePoint);
            timePoint.setTimezone(timezone);                  // require('time')
            item.TimeGMT = timePoint.toRFC3339LocaleString(); // extended.js
        });
    };

    var _speedingExtra = function (dataArray, timezone) {
        timezone = (typeof timezone != 'undefined') ? timezone : 'Asia/Novosibirsk';
        dataArray.forEach(function (item) {
            var timePoint = new Date(item.Time * 1000);
            item.TimeUTC = timePoint.toISOString();           // require("date")

            time.extend(timePoint);
            timePoint.setTimezone(timezone);                  // require('time')
            item.TimeGMT = timePoint.toRFC3339LocaleString(); // extended.js
            item.Speed = Math.floor(item.Speed * 1.852);
        });
    };

    autograph.carsModel = require('../models/cars.js')(dbConnection);

    autograph.getAllPointsForCarID = function (CarID, callback) {
        autograph.dbConnection.query('SELECT * FROM tracker WHERE CarID = ? ORDER BY Time DESC', CarID, callback);
        return this;
    };

    autograph.getLastPoints = function (CarID, callback) {
        autograph.dbConnection.query('SELECT * FROM lastPosition WHERE CarID = ? ORDER BY Time DESC LIMIT 1', [CarID],
            function (err, rows, fields) {
                _addISOdate(rows, autograph.timeZone);
                callback(err, rows, fields);
            });
        return this;
    };

    autograph.getAllLastPoints = function (callback) {
        autograph.dbConnection.query('SELECT * FROM lastPosition ORDER BY Time DESC', function (err, rows, fields) {
            _addISOdate(rows, autograph.timeZone);
            callback(err, rows, fields);
        });
        return this;
    };

    autograph.lastPositionForGroup = function (CarIDs, callback) {
        var list = '';
        if (!CarIDs.length) {
            callback(new Error('autograph.lastPositionForGroup::CarIDs empty'), null, null);
            return this;
        }

        CarIDs.forEach(function (carID, index) {
            if (index == CarIDs.length - 1) {
                list = list + util.format('"%s"', carID);
            } else {
                list = list + util.format('"%s",', carID);
            }
        });

        autograph.dbConnection.query('SELECT * FROM lastPosition WHERE CarID IN (' + list + ') ORDER BY Time DESC', function (err, rows, fields) {
            if (!err) _addISOdate(rows, autograph.timeZone);
            callback(err, rows, fields);
        });
        return this;
    };

    return autograph;
};

if (process.argv[2] == 'autographModelAsChild') {
    process.on('message', function (msg) {
        var dbConnection = require('mysql').createConnection(msg.dbconfig);
        require('../config/extended.js')();
        autographModel(dbConnection, msg.timeZone)[msg.method](msg.param.carid, msg.param.start, msg.param.end, function (err, rows, fields) {
            process.send(rows);
            dbConnection.end();
        });
    });
}

module.exports = autographModel;
