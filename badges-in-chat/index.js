const {webpack: Webpack, webpack: {common: {React}}, utilities: {makeStore}} = ultra;

const store = makeStore(false);

Webpack.whenReady.then(() => {
    document.head.appendChild(Object.assign(document.createElement("style"), {
        textContent: /*css*/`
            .chat-badges {
                display: inline-flex;
                vertical-align: bottom;
                position: relative;
                align-item: center;
                justify-content: center;
                padding: 0;
            }

            .chat-badges:has(a) {
                margin-left: .25rem;
                margin-right: -.25rem;
            }

            .repliedMessage-3Z6XBG .chat-badges:has(a) {
                margin-right: .25rem;
                margin-left: unset;
            }
        `,
        id: "badges-in-chat"
    }));
});

function renderBadgeList(user, guildId, UserBadgesList) {
    if (!store.use()) return null;

    return React.createElement(UserBadgesList, {
        size: 2, // "SIZE_18"
        user,
        guildId,
        className: "chat-badges"
    });
}

let UBL;
Webpack.addPatch({
    match: /"SYSTEM_TAG"/,
    regex: /(\w\])(\}\)\}\})/,
    once: true,
    replace: `$1.concat(importVar("renderBadgeList")(arguments[0].message.author, arguments[0].channel?.guild_id, importVar("UserBadgesList")))$2`,
    variables: {
        get renderBadgeList() {return renderBadgeList;},
        get UserBadgesList() {
            return UBL ??= Webpack.getModule(m => typeof m === "function" && m.toString().includes("PROFILE_USER_BADGES"), {deep: true});
        },
        get React() {return Webpack.common.React;}
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
