"use strict";

const fs = require("fs");
const path = require("path");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const lncall = require("./lncall");
const proxy = require("./proxy");

const newLine = "\n";
const lndDir = lncall.defaultLndPath();

const sections = [
    {
        header: "lncall",
        content: [
            "Monetize your API with the Lightning Network Daemon",
            "This project is heavily inspired by paypercall from ElementsProject"
        ]

    },
    {
        header: "Options",

        optionList: [
            {
                name: "grpc",
                alias: "g",
                description: "gRPC interface of LND",
                type: String,
                typeLabel: "{underline host}",
                defaultValue: "localhost:10009"
            },
            {
                name: "cert",
                alias: "c",
                description: "Certificate for using the LND gRPC interface",
                type: String,
                typeLabel: "{underline file}",
                defaultValue: path.join(lndDir, "tls.cert")
            },
            {
                name: "macaroon",
                alias: "m",
                description: "Macaroon for authenticating requests to LND" + newLine,
                type: String,
                typeLabel: "{underline file}",
                defaultValue: path.join(lndDir, "invoice.macaroon")
            },

            {
                name: "expiry",
                alias: "e",
                description: "After how many seconds invoices should expire" + newLine,
                type: Number,
                typeLabel: "{underline seconds}",
                defaultValue: "3600"
            },

            {
                name: "upstream",
                alias: "u",
                description: "Upstream server for the reverse proxy",
                type: String,
                typeLabel: "{underline host}"
            },
            {
                name: "host",
                alias: "h",
                description: "HTTP host for the reverse proxy",
                type: String,
                typeLabel: "{underline host}",
                defaultValue: "localhost"
            },
            {
                name: "port",
                alias: "p",
                description: "HTTP port for the reverse proxy",
                type: Number,
                typeLabel: "{underline port}",
                defaultValue: "8082"
            },
            {
                name: "rates",
                alias: "r",
                description: "Rates to charge for request to the API",
                type: String,
                typeLabel: "{underline rates}",
                defaultValue: {}
            },
            {
                name: "ratesfile",
                alias: "f",
                description: "If you want to read the rates from a file (overrides --rates)",
                type: String,
                typeLabel: "{underline file}",
            }

        ]

    },
    {
        header: "Examples",

        content: [
            "The only necessary option is \"upstream\"",
            "Please note that if you do not set a rate for a method it will be free",
            "",
            "lncall --upstream localhost:8080"
        ]

    }

];

const options = commandLineArgs(sections[1].optionList);

// Upstream is the only necessary options without a default value
if (options.upstream !== undefined) {
    startProxy();

} else {
    showHelp();
}

async function startProxy() {
    // Removes trailing "/"
    if (options.upstream.slice(-1) === "/") {
        options.upstream = options.upstream.slice(0, -1);
    }

    // TODO: trim first / of rates
    // Override "options.rates" with "options.ratesfile" if possible
    if (options.ratesfile !== undefined) {
        let ratesFile = fs.readFileSync(options.ratesfile);

        options.rates = JSON.parse(ratesFile);
    }

    let ln = new lncall.LND(options.grpc, options.cert, options.macaroon, options.expiry);

    await ln.connect();

    console.log("Starting reverse proxy on host: " + options.host + ":" + options.port);

    proxy.proxy(
        options.port,
        options.host,

        options.upstream,
        options.rates,

        ln
    );

}

function showHelp() {
    console.log(commandLineUsage(sections));
}
