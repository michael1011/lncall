"use strict";

const path = require("path");

const lnd = require("./lnd");

let defaultPath = lnd.defaultLndPath();

let lightning = new lnd.Lightning("localhost:10009", path.join(defaultPath, "tls.cert"), path.join(defaultPath, "invoice.macaroon"));

start();

async function start() {
    await lightning.connect();

    lightning.addInvoice(1, function (err, response) {
        console.log("Created invoice: " + response.payment_request);
    });

    lightning.subscribeInvoices(function (invoice) {
        if (invoice.payment_request !== undefined) {
            console.log("Invoice settled: " + invoice.payment_request);
        }

    });
}