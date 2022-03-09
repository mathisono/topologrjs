const express = require("express")
const net = require('net');
const dns = require('dns');
const dnsPromises = dns.promises;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const expressip = require('express-ip');




var app = express()
let port = 3001;

app.set('view engine', 'ejs')

app.use(express.static('dist'))
app.use(expressip().getIpInfoMiddleware);

let names = {}; //dict to hold ip addresses & hostnames names[ip] = hostname
let meshdata = {};
let jdata = {};
let odata = {};
let links = [];

async function main(res) {
  jdata = await (await load("http://localnode.local.mesh/cgi-bin/sysinfo.json?hosts=1&services=1&link_info=1")).json();
  //console.log(jdata)
  odata = await (await load("http://localnode.local.mesh:9090")).json();
  //console.log(odata)
  names = {};
  for (let i = 0; i < jdata.hosts.length; i++){
    names[jdata.hosts[i].ip] = jdata.hosts[i].name;
  }
  links = []
  for (let i = 0; i < odata.topology.length; i++){
    links.push({from: names[odata.topology[i].lastHopIP], to: names[odata.topology[i].destinationIP], pcost: odata.topology[i].pathCost, ecost: odata.topology[i].tcEdgeCost });
  }
  
  //console.table(links)

  // for (let i = 0; i < links.length; i++){
  //   console.log(links[i].from, links[i].to, links[i].pcost);
  //   if (!(links[i].from in meshdata) || meshdata[links[i].from == '']) {
  //     meshdata[links[i].from] = await getNodeData(links[i].from);
  //     console.log(links[i].from + " :from: " + JSON.stringify(meshdata[links[i].from]));
  //   }
  //   else {
  //     console.log(links[i].from + " found")
  //   }
  //   if (!(links[i].to in meshdata) || meshdata[links[i].to == '']) {
  //     meshdata[links[i].to] = await getNodeData(links[i].to);
  //     console.log(links[i].to + ":to: " + JSON.stringify(meshdata[links[i].to]));
  //   }
  //   else {
  //     console.log(links[i].to + " found")
  //   }
  // }
  res.render('index', {meshNodes: JSON.stringify(names), meshLinks: JSON.stringify(links)});
}

app.get("/",function(req,res){
  console.log(req.ipInfo.ip.replace("::ffff:",""));
  main(res);
})

app.listen(port, function () {
  console.log("Started application on port %d", port)
});


async function load(url) {
  let obj = null; 
  try {
      obj = await (await fetch(url, {timeout: 10000}));
  } catch(e) {
      console.log('error');
  }
  //console.log(obj);
  return obj;
}

async function getNodeData(node){
  console.log(node);
  try {
      out = await (await load("http://" + node + ".local.mesh/cgi-bin/sysinfo.json")).json();
  } catch (e) {
      console.log(e);
      out = ""
  }
  //console.log(node + ":: " + JSON.stringify(out));
  return out;
}