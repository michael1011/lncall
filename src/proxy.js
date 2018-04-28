"use strict";

const express = require("express");
const httpProxy = require("http-proxy");

const app = express();

function proxyRequest(proxy, upstream, req, res) {
    console.log("Passing request to: " + upstream + req.url);

    proxy.web(req, res, {
        target: upstream + req.url,
    });
}

module.exports = {
    proxy: function (port, host, upstream, rates, ln) {
        let proxyServer = httpProxy.createProxyServer();

        app.use("/", function (req, res) {
            let price = rates[req.url];

            if (price !== undefined) {
                ln.middleware(price, () => {
                    proxyRequest(proxyServer, upstream, req, res);
                })(req, res);

            } else {
                proxyRequest(proxyServer, upstream, req, res);
            }

        });

        app.listen(port, host);

    }

};