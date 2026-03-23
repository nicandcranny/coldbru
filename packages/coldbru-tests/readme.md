# bruno-tests

This package is used to test the ColdBru CLI.
We have a collection that sits in the `collection` directory.

### Test Server

This will start the server on port 8081, which exposes endpoints that the collection will hit.

```bash
# install node dependencies
npm install

# start server
npm start
```

The local testbench in this fork runs on `http://localhost:8081` by default and provides routes like `/ping`, `/api/echo/json`, and `/redirect-to-ping`.

For Playwright runs via the root repo config, this server is started automatically through `playwright.config.ts`.

### Run Bru CLI on Collection

```bash
cd collection

# run collection against local server
node ../../bruno-cli/bin/bru.js run --env Local --output junit.xml --format junit

# run collection against prod server hosted at https://testbench.usebruno.com
node ../../bruno-cli/bin/bru.js run --env Prod --output junit.xml --format junit
```

### License

[MIT](LICENSE)
