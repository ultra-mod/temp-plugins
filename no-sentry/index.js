const {webpack: Webpack} = ultra;

Webpack.addPatch({
    match: /BetterDiscord|window\.DiscordSentry=/,
    regex: /[\s\S]+/,
    replace: "() => null"
});
