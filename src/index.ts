import glob from "glob";

interface IGlobMatch {
    Err:     Error;
    Matches: string[];
}

const runGlob = async (pattern: string, options: glob.IOptions) => new Promise<IGlobMatch>((resolve) => {
    glob(pattern, options, (err, matches) => resolve({Err: err, Matches: matches}))
})

const runGlobs = async (globs: string[], options: glob.IOptions) => {
    const r = await Promise.all(globs.map((g) => runGlob(g, options)));
    const errs = r.filter((x) => !!x.Err);
    return {
        Err: errs.length ? errs[0] : null,
        Matches: [].concat(...r.map((x) => x.Matches)),
    };
}

export interface IFaqtor {
    readonly modifTime: Promise<number>;
}

export class Files implements IFaqtor {
    private globs: string[];

    constructor(...globs: string[]) {
        this.globs = globs;
    }

    public get modifTime(): Promise<number> {
        return null;
    }
}