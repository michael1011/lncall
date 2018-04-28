"use strict";

const fs = require("fs");
const grpc = require("grpc");

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

class Lightning {

    constructor (grpcHost, cert, macaroon) {
        this.grpcHost = grpcHost;
        this.cert = cert;
        this.macaroon = macaroon;

        this.meta = new grpc.Metadata();
    }

    connect() {
        let macaroonFile = fs.readFileSync(this.macaroon);

        this.meta.add("macaroon", macaroonFile.toString("hex"));

        let certFile = fs.readFileSync(this.cert);
        let creds = grpc.credentials.createSsl(certFile);

        let proto = grpc.load("src/rpc.proto");
        let lnrpc = proto.lnrpc;

        this.lightning = new lnrpc.Lightning(this.grpcHost, creds);
    }

    addInvoice(value, expiry, callback) {
        this.lightning.AddInvoice({
            value: value,
            expiry: expiry,

        }, this.meta, function (err, response) {
            callback(err, response);
        });

    }

    lookupInvoice(hash, callback) {
        this.lightning.LookupInvoice({
            r_hash: hash,

        }, this.meta, function (err, response) {
           callback(err, response);

        });

    }

}

module.exports = {
    Lightning,
};