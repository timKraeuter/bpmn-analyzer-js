[![Lint, Format & Build](https://github.com/timKraeuter/bpmn-analyzer-js/actions/workflows/ci.yml/badge.svg)](https://github.com/timKraeuter/bpmn-analyzer-js/actions/workflows/ci.yml)

This repository contains the front-end for my rust-bpmn-analyzer, see [description](https://timkraeuter.com/rust-bpmn-analyzer/) and [code](https://github.com/timKraeuter/rust_bpmn_analyzer).

# Demonstration

A demo version of the application is hosted [here](https://bpm-2024.whitefield-c9fed487.northeurope.azurecontainerapps.io/).

# Setup

The setup is standard for projects using **npm**.

## Installing dependencies

```bash
npm i
```

## Run the application

```bash
npm start
```

This expects the **rust_bpmn_analyzer** to provide the model checking web service on port **3001**.

There are two ways to run the **rust_bpmn_analyzer** for this project:

1. **Docker (image is only 4MB compressed)**

Pull the container:

```bash
docker pull tkra/rust_bpmn_analyzer
```

Run the container on port 3001:

```bash
docker run -p 3001:8080 tkra/rust_bpmn_analyzer
```

2. **Compiling from source using Rust**

Clone the [**rust_bpmn_analyzer**](https://github.com/timKraeuter/rust_bpmn_analyzer) and run the following command in the **webserver** subdirectory:

```bash
cargo run -- -p 3001
```

You need to have [Rust installed](https://www.rust-lang.org/tools/install).

## Build the application

To build the application using webpack for the **rust_bpmn_analyzer** you can run the following command:

```bash
npm run build:rust
```

This builds the application for the **rust_bpmn_analyzer** which is expected to be located in next to this project (`/../rust_bpmn_analyzer`).

# Code Linting & Style

For linting I use [eslint](https://eslint.org) and to maintain a a consistent code style I use [prettier](https://prettier.io/).
Both are checked using GitHub actions on every code change.

Run eslint and prettier using the following command:

```bash
npm run all
```

# Acknowledgements

I heavily use the excellent bpmn.io ecosystem, i.e., [bpmn-js](https://github.com/bpmn-io/bpmn-js-token-simulation) and [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation).
