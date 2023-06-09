const {webpack, webpack: {common: {React}}, storage} = ultra;

let PrivateChannelSortStore = null;

const pinned = storage.get("pin-dms", "pinned") ?? [];

webpack.addPatch({
    match: /"private-channels-"/,
    patches: [
        {
            regex: /children:(\w+\.\w+\.Messages.DIRECT_MESSAGES)/,
            replace: `children:arguments[0].section === 1 ? "Pinned DMs" : $1`
        },
        {
            regex: /renderSection[\s\S]+?(\w+)=\w+\.props\.showDMHeader/,
            replace: "$&,showHeader=$1"
        },
        {
            regex: /renderSection[\s\S]+?return (\w+!==\w+\.PAGES&&\w+)/,
            replacements: [
                `arguments[0].section > 0 && (arguments[0].section === 1 ? true : showHeader)`
            ]
        },
        {
            regex: /renderSection[\s\S]+?children:\[[\s\S]+?\}\)\]/,
            replace: `$&.slice(...(arguments[0].section === 1 ? [0, -1] : [0]))`
        },
        {
            regex: /\.render=[\s\S]+?this\.state\.preRenderedChildren/,
            replace: "$&,instance=this"
        },
        {
            regex: /sections:(\[.+?\])/,
            replacements: [
                `importVar("getSections").apply(instance)`
            ],
            variables: {
                getSections: function () {
                    return [
                        this.state.preRenderedChildren,
                        ...(this.props.privateChannelIds.length ? [pinned.length] : []),
                        Math.max(this.props.privateChannelIds.length - pinned.length, 1)
                    ];
                }
            }
        },
        {
            regex: /renderRow[\s\S]+?:\w.renderDM\(\w+,/,
            replace: `$&(arguments[0].section > 1 ? importVar("pinnedCount") : 0) +`,
            variables: {
                get pinnedCount() {return pinned.length}
            }
        }
    ],
});

webpack.addPatch({
    match: /getPrivateChannelIds=function/,
    once: true,
    regex: /(getPrivateChannelIds=function\(\){return )(\w+\(\))/,
    replace: `$1(importVar("hasStore") || (importVar("defineStore")(this))), importVar("sortChannels")($2)`,
    variables: {
        sortChannels: channels => {
            const clone = channels
                .filter(id => !pinned.includes(id))
            clone.unshift(...pinned);

            return clone;
        },
        get hasStore() {return !!PrivateChannelSortStore;},
        defineStore: instance => {
            PrivateChannelSortStore = instance;
        }
    }
});


// ContextMenu
const seen = new WeakSet();
const HandleContextMenu = (array, channel) => {
    if (seen.has(array) || !channel) return array;

    let tree, closeItem;

    for (const item of array) {
        if (Array.isArray(item?.props.children) &&
            item.props.children.some(c => c?.props.id === "close-dm" && (closeItem = c))
        ) {
            tree = item.props.children;
            break;
        }
    }

    if (!tree) return array;

    const isPinned = pinned.includes(channel.id);

    tree.push(
        React.createElement(closeItem.type, {
            label: isPinned ? "Unpin DM" : "Pin DM",
            id: "pin-dm",
            action() {
                if (isPinned) {
                    pinned.splice(pinned.indexOf(channel.id), 1);
                } else {
                    pinned.push(channel.id);
                }

                storage.set("pin-dms", "pinned", pinned);
                PrivateChannelSortStore?.emitChange();
            }
        })
    );

    return array;
};

webpack.addPatch({
    match: /close-dm/,
    regex: /(USER_ACTIONS_MENU_LABEL[\s\S]+?children:)(\[\([\s\S]+?\]\}\)\])(\}\)\}\))/,
    replace: `$1importVar("handleContextMenu")($2, arguments[0].channel)$3`,
    variables: {
        get handleContextMenu() {return HandleContextMenu;}
    }
});
