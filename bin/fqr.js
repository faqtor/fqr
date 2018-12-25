#!/usr/bin/env node

const { execFile } = require("child_process");
const fs = require("fs");

const fileExists = async (name) => {
    return new Promise((resolve) => {
        fs.access(name, (err) => resolve(err === null));
    });
};

async function runCommand(cmd, ...args) {
    return await new Promise((resolve) => {
        const proc = execFile(cmd, args);
        proc.stdout.on("data", (data) => {
            console.log(data.toString());
        });
        proc.stderr.on("data", (data) => {
            console.error(data.toString());
        });
        proc.on("exit", () => resolve(null));
        proc.on("error", (err) => resolve(err));
    });
}

(async () => {
    const v1 = "./build/fqr.config.js";
    const v2 = "./fqr.config.js";
    const argv = process.argv.slice(1);

    for (const v of [v1, v2]) {
        if (await fileExists(v)) {
            argv[0] = v;
            const err = runCommand(process.argv[0], ...argv);
            if (err !== null) {
                console.error(err);
            }
        }
    }
})();
