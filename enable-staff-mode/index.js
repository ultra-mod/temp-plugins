const {
    utilities: {predefine},
    webpack: Webpack
} = ultra;

predefine(window, "GLOBAL_ENV", env => {
    env.OLD_RELEASE_CHANNEL = env.RELEASE_CHANNEL;
    env.RELEASE_CHANNEL = "staging";
    Webpack.continueLoading();
});

Webpack.addPatch({
    match: /_handleNativeUpdateNotAvailable/,
    regex: /window\.GLOBAL_ENV\.RELEASE_CHANNEL(,\s?"\.json")/,
    replace: "window.GLOBAL_ENV.OLD_RELEASE_CHANNEL$1"
});

let UserStore = null;
Webpack.addPatch({
    match: /hasAnyStaffLevel/,
    regex: /\w+\.hasFlag\(\w+\.\S+\.STAFF\)/,
    replace: `importVar("UserStore").getCurrentUser()?.id === this.id`,
    variables: {
        get UserStore() {
            return UserStore ??= Webpack.getModule(m => m?.getCurrentUser && m._dispatchToken, {deep: true});
        }
    }
});
