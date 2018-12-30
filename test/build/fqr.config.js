module.exports = {
    hello: async () => {
        console.log("Hello World");
        return null;
    },
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