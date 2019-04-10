#!/home/monitor/.nvm/versions/node/v10.7.0/bin/node --no-deprecation

const fs = require('fs')
fs.writeFileSync('/run/monitor/monitor.probe.ping.pid',process.pid)

const common = require('../common/lib.js')

const netping = require('./netping.js')

var redis = require("redis")
var db = redis.createClient()




var traces = {}

function done(ip) {
  console.log('------------------------------------------------------------ probe done --------------',ip)
  return function(error,ip) {
    console.log('----- probe done ----------',error,ip)
//    console.log('traces:',traces[ip])
//    const traceit = tracer.includes(ip)
//    if(error && traceit) {
//    if(error) {
//      console.log('----- probe done trace error -----',error,ip)
//      console.log('trace',ip,error.toString());
//      return;
//    }
//    console.log('----- probe done no error -----',ip)
//    console.log('trace2',ip,error.toString());
//    if(traceit) {
//      console.log('-------------------trace',ip,'done',traces[ip].length)
//    }
//    const xx = JSON.stringify(traces[ip])
//    db.publish('net32:trace',xx)
  }
}

function feedback(ip) {
  console.log('------------------------------------------------------------ probe feedback ----------',ip)
  return function(error,ip,ttl,sent,rcvd) {
    console.log('----- probe feedback ------',ttl,error.message,ip)
    var x = { ip:ip, ttl:ttl, rtt:rcvd-sent }
//    console.log('probe error',error)
    x.source = (error) ? error.source : ip
    x.error = (error) ? error.name : null
//    console.log('probe feedback',x)
    traces[ip].push(x)
    //x.transit = networks.transit[x.source]
    if(x.source!=undefined) {
      x.pfai = (x.source.indexOf('100.128.')==0)
    }
    if(ip===x.source) {
      const xx = JSON.stringify(x)
      db.publish('trace',xx)
    }
    return false;
  }
}








var events = require('events');
var watcher = new events.EventEmitter();

watcher.on('echo',function(ip) {
  //trace(ip,'echo')
  netping.echo(ip,function(error,ip,sent,rtt) {
    const x = { ip:ip, sent:sent, rtt:rtt, error:error }
    const xx = JSON.stringify(x)
    //if(x.ip==="une ip") { console.log('ping2',xx); }
    db.publish('ping2',xx)
  })
})


/*
function doechoip(ip) {
  return function() {
  }
}
*/

watcher.on('traceroute',function(ip,transit,ttl) {
  console.log('------------------------------------------------------------ probe trace -------------',ip)
  traces[ip] = []
  netping.traceroute(ip,ttl,done(ip),feedback(ip))
})

function dotracerouteip(ip,transit,ttl) {
  return function() {
//    watcher.emit('traceroute',ip,transit,20)
//    watcher.emit('traceroute',ip,transit,ttl)
  }
}









function dotraceroute() {
  const ip = "une ip"
//  setTimeout(dotracerouteip(ip,'XXX',12),2000+10*1000*Math.random())
//  setTimeout(dotracerouteip(ip,'XXX',60),2000+10*1000*Math.random())
}



var scheduled = {}

const sub = redis.createClient()
sub.on("message", function (channel, message) {
  if(channel==="monitor" && message==="minutely") {
//    console.log('minutely')
    //doecho()
//    dotraceroute()
  } else
  if(channel==="network32") {
    const ip = message
    if(!common.ip32.test(ip) || scheduled[ip]) { return; }
    scheduled[ip] = true
    //if(ip==="une ip") { console.log(channel,ip); }
    setTimeout(function(ip) {
      return function() {
        setInterval(function(ip) {
//           if(ip==="une ip") { console.log('setint net32',ip); }
           return function() {
             //if(ip==="une ip") { console.log('setintd net32',ip); }
             watcher.emit('echo',ip)
           }
        }(ip),60*1000)
      }
    }(ip),60*1000*Math.random())
  }
})
sub.subscribe('monitor')
sub.subscribe('network32')

db.publish('monitor','networks')
