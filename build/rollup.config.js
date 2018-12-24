import typescript from 'rollup-plugin-typescript2';
import commonjs   from 'rollup-plugin-commonjs';
import resolve    from 'rollup-plugin-node-resolve';

export default {
    external: [ 'fs', 'events', 'path', 'assert', 'util' ],
    plugins: [
        typescript({
            typescript: require('typescript'),
            tsconfig: "build/tsconfig.build.json"
        }),
        resolve(),
        commonjs({
            namedExports: {
              'node_modules/glob/glob.js': [ 'default' ]
            }
        }),
    ]
}