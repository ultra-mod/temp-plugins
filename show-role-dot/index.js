const {webpack: Webpack, utilities: {makeStore}} = ultra;

const store = makeStore(false);

Webpack.addPatch({
    match: /"SYSTEM_TAG"/,
    once: true,
    regex: /(\w\s?=\s?)("dot"\s?===\s?\w)/,
    replace: `$1importVar("store").use() || $2`,
    variables: {
        store
    }
});


module.exports = {
    enable() {
        store.set(true);
    },
    disable() {
        store.set(false);
    }
}
