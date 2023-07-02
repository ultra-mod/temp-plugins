const {webpack: Webpack, utilities: {makeStore}} = ultra;

const ThemeStore = Webpack.lazy(Webpack.Filters.byStore("ThemeStore"));

const store = makeStore(false);

Webpack.addPatch({
    match: /ThemeStore/,
    once: true,
    regex: /key:"theme",get:function\(\)\{/,
    replace: `$&if (importVar("isEnabled")) return "amoled";`,
    variables: {
        get isEnabled() {return store.get();}
    }
});

module.exports = new class {
    enable() {
        store.set(true);
        ThemeStore.emitChange?.();
    }

    disable() {
        store.set(false);
        ThemeStore.emitChange?.();
    }
}
