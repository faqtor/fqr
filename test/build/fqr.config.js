const {cmd, mode} = require("faqtor");

module.exports = {
    hello: cmd("echo Hello, "),
    mode: () => console.log(mode),
    helloFactor: {
        named(name) {
            this.name = name;
            return this;
        },
        async run() {
            console.log(`Hello World from factor "${this.name}"`);
            return null;
        }
    }
}