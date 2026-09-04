import { createRequire } from "node:module";
import { defineConfig, rspack } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginStyledComponents } from "@rsbuild/plugin-styled-components";
import { pluginSass } from "@rsbuild/plugin-sass";

const require = createRequire(import.meta.url);

const nodePolyfillFallbacks = {
    assert: require.resolve("assert/"),
    buffer: require.resolve("buffer/"),
    console: require.resolve("console-browserify"),
    constants: require.resolve("constants-browserify"),
    crypto: false,
    domain: require.resolve("domain-browser"),
    events: require.resolve("events/"),
    fs: false,
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    module: false,
    os: require.resolve("os-browserify/browser.js"),
    path: require.resolve("path-browserify"),
    process: require.resolve("process/browser.js"),
    punycode: require.resolve("punycode/"),
    querystring: require.resolve("querystring-es3/"),
    readline: false,
    repl: false,
    stream: require.resolve("stream-browserify"),
    _stream_duplex: require.resolve("readable-stream/lib/_stream_duplex.js"),
    _stream_passthrough: require.resolve(
        "readable-stream/lib/_stream_passthrough.js",
    ),
    _stream_readable: require.resolve(
        "readable-stream/lib/_stream_readable.js",
    ),
    _stream_transform: require.resolve(
        "readable-stream/lib/_stream_transform.js",
    ),
    _stream_writable: require.resolve(
        "readable-stream/lib/_stream_writable.js",
    ),
    string_decoder: require.resolve("string_decoder/"),
    sys: require.resolve("util/util.js"),
    timers: require.resolve("timers-browserify"),
    tls: false,
    tty: require.resolve("tty-browserify"),
    url: require.resolve("url/"),
    util: require.resolve("util/util.js"),
    v8: false,
    vm: require.resolve("vm-browserify"),
    worker_threads: false,
    zlib: require.resolve("browserify-zlib"),
};

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginStyledComponents(),
        pluginSass(),
        pluginBabel({
            include: /\.(?:js|jsx|tsx)$/,
            babelLoaderOptions(opts) {
                opts.plugins?.unshift("babel-plugin-react-compiler");
            },
        }),
    ],
    source: {
        tsconfigPath: "./jsconfig.json", // Specifies the path to the JavaScript/TypeScript configuration file,
        exclude: ["**/test-utils/**", "**/*.test.*", "**/*.spec.*"],
    },
    html: {
        title: "ColdBru",
    },
    tools: {
        rspack: {
            module: {
                parser: {
                    javascript: {
                        // This loads the JavaScript contents from a library along with the main JavaScript bundle.
                        dynamicImportMode: "eager",
                    },
                },
            },
            ignoreWarnings: [
                (warning) =>
                    warning.message.includes(
                        "Critical dependency: the request of a dependency is an expression",
                    ) &&
                    warning?.moduleDescriptor?.name?.includes("flow-parser"),
            ],
            plugins: [
                new rspack.ProvidePlugin({
                    Buffer: [require.resolve("buffer/"), "Buffer"],
                    process: require.resolve("process/browser.js"),
                }),
                new rspack.NormalModuleReplacementPlugin(
                    /^node:/,
                    (resource) => {
                        resource.request = resource.request.replace(
                            /^node:/,
                            "",
                        );
                    },
                ),
            ],
            resolve: {
                fallback: nodePolyfillFallbacks,
            },
            // Add externals configuration to exclude Node.js libraries
            externals: {
                // List specific Node.js modules you want to exclude
                // Format: 'module-name': 'commonjs module-name'
                worker_threads: "commonjs worker_threads",
                // 'path': 'commonjs path'
            },
        },
    },
});
