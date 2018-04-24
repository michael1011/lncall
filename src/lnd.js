"use strict";

const grpc = require("grpc");
const fs = require("fs");

const os = require("os");
const path = require("path");

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

class Lightning {
    constructor (grpcHost, cert, macaroon) {
        this.grpcHost = grpcHost;
        this.cert = cert;
        this.macaroon = macaroon;

        this.meta = new grpc.Metadata();
    }

    async connect() {
        let macaroonFile = fs.readFileSync(this.macaroon);

        this.meta.add("macaroon", macaroonFile.toString("hex"));

        let certFile = fs.readFileSync(this.cert);
        let creds = grpc.credentials.createSsl(certFile);

        let proto = grpc.load("src/rpc.proto");
        let lnrpc = proto.lnrpc;

        this.lightning = new lnrpc.Lightning(this.grpcHost, creds);
    }

    addInvoice(value, callback) {
        this.lightning.AddInvoice({
            value: value,

        }, this.meta, function (err, response) {
            callback(err, response)
        });

    }

    subscribeInvoices(callback) {
        let call = this.lightning.SubscribeInvoices({}, this.meta);

        call
            .on("data", function (invoice) {
                callback(invoice)
            })

            .on("end", function () {
                console.error("Disconnected from LND");

                process.exit(1);
            });

    }

}

module.exports = {
    Lightning,

    defaultLndPath: function () {
        let homeDir = os.homedir();

        switch (os.platform()) {
            case "darwin":
                return path.join(homeDir, "Library", "Application Support", "Lnd");

            case "win32":
                return path.join(homeDir, "AppData", "Local", "Lnd");

            default:
                return path.join(homeDir, ".lnd");

        }

    }

};