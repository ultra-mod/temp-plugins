const {webpack: Webpack, utilities: {makeStore}} = ultra;

const store = makeStore(false);

Webpack.addPatch({
    match: /"message-actions"/,
    regex: /(canConfigureJoin:\w+,isExpanded:)(\w+)/,
    replace: `$1 importVar("store").use() || $2`,
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
