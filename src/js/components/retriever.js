/*

Typical usage:

// create a Retriever that will call our function when data exists
var pup = new Retriever(this.load);
// set the URL and start the tick
pup.watch(this.getAttribute("src"), 15);

*/

class Retriever {
  constructor(callback) {
    this.ondata = callback;
    this.timeout = null;
    this.interval = 15;
    this.etag = null;
    this.url = null;
    this.tick = this.tick.bind(this);
  }

  watch(url, interval) {
    this.stop();
    if (interval) {
      this.start(interval);
    }
    this.url = url;
    this.fetch();
  }

  once(url) {
    this.url = url;
    this.fetch();
  }

  async fetch() {
    if (!this.url) return;
    var response = await fetch(this.url, {
      headers: {
        "If-None-Match": this.etag
      }
    });
    if (response.status >= 400) {
      return console.log(`Request for ${this.url} failed with ${response.statusText}`);
    }
    if (response.status == 304) {
      return;
    }
    this.etag = response.headers.get("etag");
    var data = await response.json();
    this.ondata(data, response);
  }

  async tick() {
    await this.fetch();
    this.start();
  }

  start(interval = this.interval) {
    this.stop();
    this.interval = interval;
    this.timeout = setTimeout(this.tick, interval * 1000);
  }

  stop() {
    if (this.timeout) clearTimeout(this.timeout);
  }

}

module.exports = Retriever;