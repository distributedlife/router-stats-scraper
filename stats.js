var request = require('request');
var cheerio = require('cheerio');
var last = require('lodash').last;
var fs = require('fs');

var url = 'http://admin:' + process.env.PASSWORD + '@192.168.0.1/RST_stattbl.htm';
var interval = 15000;

function getStats () {
  request(url, function (err, response) {
    var $ = cheerio.load(response.body);
    var d = $('table:nth-child(2)');

    var uptime = d.find('tr:nth-child(3) td table > tr:nth-child(2)');
    var connectionSpeed = d.find('tr:nth-child(4) td table > tr:nth-child(2)');
    var lineAttenuation = d.find('tr:nth-child(4) td table > tr:nth-child(3)');
    var noiseMargin = d.find('tr:nth-child(4) td table > tr:nth-child(3)');

    var result = {
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

    console.log(result.uptime);
  });
}

getStats();