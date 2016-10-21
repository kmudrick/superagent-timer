'use strict';

function plugin(onEnd) {
  return (request) => {
    // The request is ready to start being timed
    const start = Date.now();

    // The original end on the request is going to have to be invoked eventually.
    // Even the superagent promise resolving internally calls end()
    const originalEnd = request.end;

    // Make end() on the request wrap with the plugin timing logic & handling
    request.end = function end(callback) {
      const wrappedCallback = (err, res) => {
        if (onEnd) {
          const elapsed = Date.now() - start;
          // Before we calling the original end() processing, call the onEnd
          // callback supplied to the plugin
          onEnd(request, elapsed);
        }

        // The original callback supplied to the request.end() call
        callback(err, res);

        return request;
      };
      return originalEnd.call(request, wrappedCallback);
    };

    // Superagent returns the request from end
    return request;
  };
}

module.exports = plugin;
