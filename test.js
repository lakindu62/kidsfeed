const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.y3s1-af-kidsfeed.wwmnexn.mongodb.net', (err, addresses) => {
  console.log(err || addresses);
});