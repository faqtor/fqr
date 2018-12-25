import glob from "glob";
import * as fs from "fs";
import * as util from "util";
import stringArgv from "string-argv";

interface IGlobMatch {
    Errs:    Error[];
    Matches: string[];
}

const runGlob = async (pattern: string, options: glob.IOptions) => new Promise<IGlobMatch>((resolve) => {
    glob(pattern, options, (err, matches) => resolve({Errs: err ? [err] : null, Matches: matches}))
})

const runGlobs = async (globs: string[], options: glob.IOptions) => {
    const r = await Promise.all(globs.map((g) => runGlob(g, options)));
    return {
        Errs: [].concat(r.filter((x) => !!x.Errs)),
        Matches: [].concat(...r.map((x) => x.Matches)),
    };
}

export type Domain = null | string | string[];

export type Factor = (d?: Domain) => Promise<Error>;

const normalizeDomain = (d: Domain): string[] => d === null ? [] : typeof d === "string" ? [d] : d;

const fileStat = util.promisify(fs.stat);

function printErrors(errs: Error[]) {
    for (const err of errs) {
        console.error(err);
    }
}

export function factor(f: Factor, input: Domain, output: Domain = null): [Domain, Factor] {
    const inp = normalizeDomain(input);
    const outp = normalizeDomain(output);
    const newDomain = inp.concat(outp);

    return [newDomain, async () => {
        if (!inp.length) { return await f(); }
        const filesIn = await runGlobs(inp, {});
        if (filesIn.Errs.length) {
            printErrors(filesIn.Errs);
        }
        if (!filesIn.Matches.length) { return null; }
        if (!outp.length) { return await f(filesIn.Matches); }
        const accOut = await Promise.all(outp.map((x) => new Promise<boolean>((resolve) => {
            fs.access(x, (err) => resolve(err === null))
        })));
        if (accOut.filter((x) => !x).length) { return await f(filesIn.Matches); }

        const statsIn = await Promise.all(filesIn.Matches.map(async (x) => fileStat(x)));
        const statsOut = await Promise.all(outp.map(async (x) => fileStat(x)));

        const inModified = Math.max(...statsIn.map((x) => x.mtime.getTime()));
        const outModified = Math.max(...statsOut.map((x) => x.mtime.getTime()));
        if (inModified > outModified) { return await f(filesIn.Matches); }
        return null;
    }];
}

export const cmd = (s: string): Factor => {
    const argv = stringArgv(s);
    return async () => {
        // TODO:
        return null;
    }   
}