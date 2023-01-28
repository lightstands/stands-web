module.exports = {
    plugins: [
        require("postcss-preset-env")({
            stage: 2,
            features: {
                "blank-pseudo-class": false,
                "focus-within-pseudo-class": false, // The supported platforms already have this feature
                "has-pseudo-class": false,
            },
            enableClientSidePolyfills: true,
        }),
    ],
};
