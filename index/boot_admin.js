(function () {
    var originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        if (typeof input === 'string') {
            input = input.replace('https://nroghost.com', '').replace('http://localhost:5000', '');
        }
        return originalFetch(input, init);
    };
})();
