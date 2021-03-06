"use strict";

const lncall = require("../src/lncall");
const path = require("path");
const express = require("express");

let app = express();

let ln = new lncall.LND("localhost:10009",
    path.join(lncall.defaultLndPath(), "tls.cert"),
    path.join(lncall.defaultLndPath(), "invoice.macaroon"),
    20
);

start();

setInterval(() => {
    ln.clearExpiredTokens(ln.tokens);

    console.log("Cleared tokens");

}, 10000);

async function start() {
    await ln.connect();

    app.get("/test", ln.middleware(10, (req, res) => {
        res.send("Success!");
    }));

    app.get("/", function (req, res) {
        res.send("Hello World!");
    });

    app.listen(3000);
}
