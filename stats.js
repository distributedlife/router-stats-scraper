var request = require('request');
var cheerio = require('cheerio');
var last = require('lodash').last;
var includes = require('lodash').includes;
var moment = require('moment');
var fs = require('fs');

var url = 'http://admin:' + process.env.PASSWORD + '@192.168.0.1/RST_stattbl.htm';
var getLoginId = 'http://admin:' + process.env.PASSWORD + '@192.168.0.1/MNU_access_multiLogin2.htm';

function multiLogin (id) {
  return 'http://admin:' + process.env.PASSWORD + '@192.168.0.1/multi_login.cgi?id=' + id;
}

var interval = 15000;
var requiresRedirect = 'MNU_access_multiLogin2.htm';

function postRes (err, res) {
  if (err) {
    console.error(err);
  }
}

function getStats () {
  request(url, function (err, response) {
    if (err) {
      console.error(err);
    }

    if (includes(response.body, requiresRedirect)) {
      request(getLoginId, function (err, response) {
        var $ = cheerio.load(response.body);

        var id = $('form').attr('action').split('id=')[1];

        request.post({uri: multiLogin(id), form: {act: 'yes'}}, postRes);
      });

      return getStats();
    }

    var $ = cheerio.load(response.body);
    var d = $('table:nth-child(2)');

    var uptime = d.find('tr:nth-child(3) td table > tr:nth-child(2)');
    var connectionSpeed = d.find('tr:nth-child(4) td table > tr:nth-child(2)');
    var lineAttenuation = d.find('tr:nth-child(4) td table > tr:nth-child(3)');
    var noiseMargin = d.find('tr:nth-child(4) td table > tr:nth-child(3)');

    var result = {
      timestamp: moment().unix(),
      uptime: $(last(uptime.children())).text().trim(),
      connectionSpeed: {
        downstream: $(connectionSpeed.children()[1]).text().split(' ')[0],
        upstream: $(connectionSpeed.children()[2]).text().split(' ')[0]
      },
      lineAttenuation: {
        downstream: $(lineAttenuation.children()[1]).text().split(' ')[0],
        upstream: $(lineAttenuation.children()[2]).text().split(' ')[0]
      },
      noiseMargin: {
        downstream: $(noiseMargin.children()[1]).text().split(' ')[0],
        upstream: $(noiseMargin.children()[2]).text().split(' ')[0],
      }
    };

    var allResults = require('./results');
    allResults.push(result);
    fs.writeFile('results.json', JSON.stringify(allResults), function () {
      setTimeout(getStats, interval);
    });

    console.log(result.timestamp, result.uptime);
  });
}

getStats();