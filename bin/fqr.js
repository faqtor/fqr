#!/usr/bin/env node

if (process.argv.length < 3) {
    console.error("target name expected");
    process.exit(1);
}

const fs = require("fs");
const resolve = require('path').resolve;

const fileExists = async (name) => {
    return new Promise((resolve) => {
        fs.access(name, (err) => resolve(err === null));
    });
};

async function runFactor(name, x, argv) {
    if (typeof x === "function") {
        return await x(argv);
    }
    if (x.run && typeof x.run === "function") {
        if (typeof x.named !== "undefined") {
            x = x.named(name);
        }
        return await x.run(argv);
    }
    return new Error(`FQR: something wrong with factor "${name}"`);
}

const minimist = require("minimist");
const stringArgv = require("string-argv");

(async () => {
    const v1 = "./build/fqr.config.js";
    const v2 = "./fqr.config.js";
    argsTab = minimist(process.argv.slice(2));

    if (!argsTab["_"].length) {
        console.error("target name expected");
        process.exit(1);
    }

    const argv = stringArgv(argsTab["_"][0]);

    global.FAQTOR_MODE = "production";
    if ("mode" in argsTab) {
        global.FAQTOR_MODE = argsTab["mode"];
    }

    for (const v of [v1, v2]) {
        if (await fileExists(v)) {
            try {
                const rv = resolve(v);
                const tab = require(rv);
                const name = argv[0];
                const err = await runFactor(name, tab[name], argv.slice(1));
                if (err) {
                    if (typeof err.reported === "undefined") console.error(err);
                    if (typeof err.nothingToDo === "undefined") process.exit(1);
                }
                process.exit(0);
            } catch (e) {
                console.error(e);
                process.exit(1);
            }
        }
    }
    console.error("No 'fqr.config.js' found");
    process.exit(1);
})();
