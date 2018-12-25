import glob from "glob";
import * as fs from "fs";
import * as util from "util";
import stringArgv from "string-argv";
import which from "which";
import resolveBin from "resolve-bin";
import { execFile } from "child_process";

declare function resolveBin(name: string, cb: (err: Error, rpath: string) => void);

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

async function runCommand(cmd: string, ...args: string[]): Promise<Error> {
    return await new Promise((resolve) => {
        const proc = execFile(cmd, args);
        proc.stdout.on('data', function(data) {
            console.log(data.toString()); 
        });
        proc.stderr.on('data', function(data) {
            console.error(data.toString()); 
        });
        proc.on("exit", () => resolve(null));
        proc.on("error", (err) => resolve(err));
    })
}

export const cmd = (s: string): Factor => {
    const argv = stringArgv(s);
    return async () => {
        if (!argv.length) { return null; }
        let err: Error = null;
        let rpath: string;
        [err, rpath] = await new Promise((resolve) => {
            which(argv[0], (err, rpath) => resolve([err, rpath]))
        });
        if (!err) {
            return await runCommand(rpath, ...argv.slice(1));
        }
        [err, rpath] = await new Promise((resolve) => {
            resolveBin(argv[0], (err, rpath) => resolve([err, rpath]))
        });
        if (!err) {
            argv[0] = rpath;
            return await runCommand(process.argv[0], ...argv);
        }
        return err;
    }   
}

export const seq = (...factors: Factor[]): Factor => async () => {
    for (const f of factors) {
        const err = await f();
        if (err) { return err; }
    }
    return null;
}