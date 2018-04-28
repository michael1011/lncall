"use strict";

const os = require("os");
const path = require("path");
const crypto = require("crypto");

const lnd = require("./lnd");

class LND {

    // Expiry in seconds
    constructor (grpcHost, cert, macaroon, expiry) {
        this.secret = crypto.randomBytes(32).toString("hex");
        this.tokens = [];

        this.expiry = expiry;

        this.lightning = new lnd.Lightning(grpcHost, cert, macaroon);
    }

    async connect() {
        this.lightning.connect();
    }

    // Amount is in Satoshis
    // The callback is called if the request is successful
    middleware(amount, callback) {
        return (req, res) => {
            if (req.get("X-Token") !== undefined) {
                let token = req.get("X-Token");

                if (this.checkToken(req, token)) {
                    if (this.tokens[token] !== undefined) {

                        this.lightning.lookupInvoice(this.tokens[token].r_hash, (err, response) => {
                            if (err === null) {
                                if (response.settled) {
                                    delete this.tokens[token];

                                    callback(req, res);

                                } else {
                                    res.status(403);

                                    res.send("Invoice was not paid");
                                }

                            } else {
                                // TODO: add error handling
                                console.error(err);
                            }

                        });

                    } else {
                        res.status(410);

                        res.send("Token already used or expired");
                    }

                } else {
                    res.status(403);

                    res.send("Invalid token");
                }

            } else {
                this.newRequest(amount, this.expiry, req, (response, expiry, token) => {
                    this.tokens[token] = {
                        "r_hash": response.r_hash,
                        "expiry": expiry,
                    };

                    res.status(402);
                    res.type("application/vnd.lightning.bolt11");
                    res.set("X-Token", token);

                    res.send(response.payment_request);
                });

            }

        };

    }

    newRequest(amount, expiry, req, callback) {
        this.lightning.addInvoice(amount, expiry, (err, response) => {
            if (err === null) {
                let date = new Date();

                date.setTime(date.getTime() + (expiry * 1000));

                let id = response.r_hash.toString("hex");

                callback(response, date, this.makeToken(req, id));

            } else {
                // TODO: add error handling
                console.error(err);
            }

        });

    }

    checkToken(req, token) {
        let id = token.split(".")[0];

        return token === this.makeToken(req, id);
    }

    makeToken(req, id) {
        let hmac = crypto.createHmac("sha256", this.secret)
            .update([id, req.method, req.path].join(" "))

            .digest()
            .toString("base64")
            .replace(/\W+/g, "");

        return id + "." + hmac;
    }

    // Clears tokens which were created out of the range of the threshold
    // Event paid tokens are affected by this method
    //
    // Threshold in seconds
    async clearTokens(threshold) {
        // Convert threshold to milliseconds
        threshold = threshold * 1000;

        let date = new Date();

        for (let index in this.tokens) {
            let token = this.tokens[index];

            let difference = date.getTime() - token.expiry.getTime();

            if (difference > threshold) {
                delete this.tokens[index];
            }

        }

    }

    // Clears tokens with unpaid and expired invoices
    async clearExpiredTokens() {
        let date = new Date();

        for (let index in this.tokens) {
            let token = this.tokens[index];

            if (date > token.expiry) {
                this.lightning.lookupInvoice(token.r_hash, (err, response) => {
                    if (!response.settled) {
                        // Invoice is expired and was not paid
                        delete this.tokens[index];
                    }

                });

            }

        }

    }

}

module.exports = {
    LND,

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