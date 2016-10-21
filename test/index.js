'use strict';

const assert = require('assert');
const superagent = require('superagent');
const fauxJax = require('faux-jax');
const lolex = require('lolex');
const plugin = require('../index');

const assertWithin = (expected, value, threshold) => assert.ok(
  value >= expected - threshold && value <= expected + threshold,
  `Expected ${expected} to be within ${threshold} of ${value}`
);

describe('Superagent Timer Plugin', function() {

  describe('Simulated via Nock', function() {

    // We know we are going to introduce a real delay > 2s in our test
    this.timeout(4000);

    // Nock provides a scope which breaks faux-jax if loaded at the module level
    const nock = require('nock');

    afterEach(() => {
      // clear any interceptors the tests set up
      nock.cleanAll();
      // do not use nock.restore() - that restores what the require('nock') does!
    });

    it('invokes the callback when end is invoked', (done) => {
      let captured = {};
      nock('http://localhost')
        .get('/foo')
        .delay(2222) // Delay for 2222ms (real time)
        .reply(204);
      superagent
        .get('http://localhost/foo')
        .use(plugin((request, elapsed) => {
          captured = { request, elapsed };
        }))
        .end((err, res) => {
          const { request, elapsed } = captured;
          assert.ok(
            request instanceof superagent.Request,
            'Expected request to be a superagent Request'
          );
          // Can't guarantee other things were not happening as well, so lets
          // give a sane threshold of 50ms that the elapsed time can be within.
          assertWithin(2222, elapsed, 50);
          done();
        });
    });

    it('invokes the callback when the promise resolves', (done) => {
      let captured = {};
      nock('http://localhost')
        .get('/foo')
        .delay(2222) // Delay for 2222ms (real time)
        .reply(204);
      superagent
        .get('http://localhost/foo')
        .use(plugin((request, elapsed) => {
          captured = { request, elapsed };
        }))
        .then(
          // fulfilled
          () => {
            const { request, elapsed } = captured;
            assert.ok(
              request instanceof superagent.Request,
              'Expected request to be a superagent Request'
            );
            // Can't guarantee other things were not happening as well, so lets
            // give a sane threshold of 50ms that the elapsed time can be within.
            assertWithin(2222, elapsed, 50);
            done();
          },
          // when rejected, pass the exception to done
          done
        );
    });

  });

  describe('Simulated via FauxJax & Lolex', () => {

    beforeEach(() => {
      fauxJax.install();
      this.clock = lolex.install();
    });

    afterEach(() => {
      this.clock.uninstall();
      fauxJax.restore();
    });

    it('invokes the callback when end is invoked', (done) => {
      let captured = {};
      fauxJax.on('request', (request) => {
        // Simulate 2222ms as passing before the response happens
        this.clock.tick(2222);
        request.respond(204);
      });
      superagent
        .get('/foo')
        .use(plugin((request, elapsed) => {
          captured = { request, elapsed };
        }))
        .end((err, res) => {
          const { request, elapsed } = captured;
          assert.ok(
            request instanceof superagent.Request,
            'Expected request to be a superagent Request'
          );
          assert.equal(elapsed, 2222);
          done();
        });
    });

    it('invokes the callback when the promise resolves', (done) => {
      let captured = {};
      fauxJax.on('request', (request) => {
        // Simulate 2222ms as passing before the response happens
        this.clock.tick(2222);
        request.respond(204);
      });
      superagent
        .get('/foo')
        .use(plugin((request, elapsed) => {
          captured = { request, elapsed };
        }))
        .then(
          () => {
            const { request, elapsed } = captured;
            assert.ok(
              request instanceof superagent.Request,
              'Expected request to be a superagent Request'
            );
            assert.equal(elapsed, 2222);
            done();
          },
          done
        );
    });

  });

});
