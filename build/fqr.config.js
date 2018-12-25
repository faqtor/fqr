const {factor, cmd, seq} = require("fqr");

const rollupFactor = (input, output, format, name, config) =>
    factor(
        cmd(`rollup -c ${config} -i ${input} -o ${output} -m -f ${format} -n ${name}`),
        input,
        output);

const indexInput = "src/index.ts";
const esOutput = "dist/index.es.js";
const cjsOutput = "dist/index.cjs.js";
const cfg = "build/rollup.config.js";

const cleanFactor = factor(cmd("rimraf ./dist"), "./dist");

const buildFactor = seq(
    cleanFactor,
    rollupFactor(indexInput, esOutput, "es", "fqr", cfg),
    rollupFactor(indexInput, cjsOutput, "cjs", "fqr", cfg),
)

const tab = {
    "build": buildFactor,
    "clean": cleanFactor,
}

(async () => {
    if (process.argv.length > 2 && process.argv[2] in tab) {
        const err = await tab[process.argv[2]];
        if (err) console.error(err);
    }
})();

