
var netping = require("../common/netpinglib")

var session = netping.createSession({
  networkProtocol: netping.NetworkProtocol.IPv4,
  sessionId:(process.pid%65535),
  packetSize:24,
  timeout:1000,
  retries:1,
  ttl:24
})

module.exports = {

  echo: function(ip,f) {
    //console.log('echo',ip)
    session.pingHost(ip,function(error,ip,sent,rcvd) {
      if(f) f(error,ip,sent,rcvd-sent)
    })
  },

  traceroute: function(ip,ttl,done,feedback) {
    const options = {
	ttl:24, startTtl:1, maxHopTimeouts:30
    }
    session.traceRoute(ip,options,feedback,done)
  },

}
