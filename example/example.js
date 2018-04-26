"use strict";

start();

async function start() {
    const lncall = require("../src/lncall");
    const path = require("path");
    const express = require("express");

    let app = express();

    let pay = new lncall.LND("localhost:10009",
        path.join(lncall.defaultLndPath(), "tls.cert"),
        path.join(lncall.defaultLndPath(), "invoice.macaroon")
    );

    await pay.connect();

    app.post("/test", pay.middleware(10, (req, res) => {
        res.send("Success!");
    }));

    app.get('/', function (req, res) {
        res.send('Hello World')
    });

    app.listen(3000);
}
