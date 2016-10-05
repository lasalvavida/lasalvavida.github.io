module.exports = {
    entry : "./js/main.js",
    output : {
        path : __dirname,
        filename : 'js/build/bundle.js',
        libraryTarget : 'var',
        library : 'Blog'
    }
};
