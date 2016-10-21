# superagent-timer

Plugin for [superagent](https://github.com/visionmedia/superagent) to capture
response times on requests.

## Install

```
npm install superagent-timer
```

## Usage

Require the necessary modules:

```
const superagent = require('superagent');
const timer = require('superagent-timer');
```

Provide a callback to do something with the superagent request & the time
elapsed in milliseconds.  In this example, we simply log it to the console,
but perhaps your use case involves using a logger like bunyan, or saving
this data to some metric-gathering service.

```
const onEnd = (request, elapsed) => {
  console.log(`${request.method} to ${request.url} took ${elapsed} ms`);
}
```

Use the timer plugin with our defined callback:

```
superagent
  .get('http://localhost/foo')
  .use(timer(onEnd)
  .end((err, res) => {
    // Maybe do something with the data
  });
```
