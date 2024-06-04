[![Lint, Format & Build](https://github.com/timKraeuter/bpmn-analyzer-js/actions/workflows/ci.yml/badge.svg)](https://github.com/timKraeuter/bpmn-analyzer-js/actions/workflows/ci.yml)

This repository contains a BPMN modeler (using [bpmn-js](https://github.com/bpmn-io/bpmn-js)) with continuous integrated **control-flow analysis**, **error visualization**, and potential **quick-fixes** using my [rust_bpmn_analyzer](https://github.com/timKraeuter/rust_bpmn_analyzer), see detailed [description](https://timkraeuter.com/rust-bpmn-analyzer/) on my website.

A demo version of the application is hosted [here](https://bpm-2024.whitefield-c9fed487.northeurope.azurecontainerapps.io/) ([server-side in Rust](https://github.com/timKraeuter/rust_bpmn_analyzer)) and [here](https://timkraeuter.com/bpmn-analyzer-js/) (fully client-side using WebAssembly).

The following screenshot shows a simple situation where the control flow in BPMN can get stuck (violates the **Option To Complete** property).
A **counter-example** shows the token flow in the diagram leading to this situation.
[![image](https://github.com/timKraeuter/bpmn-analyzer-js/assets/21026858/f9f96508-a17b-48ae-be2e-554f59c04cad)](https://bpm-2024.whitefield-c9fed487.northeurope.azurecontainerapps.io/)

# Setup

The setup is standard for projects using **npm**.

## Installing dependencies

```bash
npm i
```

## Run the application

The following command will start the application ready to be used.

```bash
npm start
```

Model checking is provided using the WebAssembly module cross-compiled from the **rust_bpmn_analyzer**.

As an alternative, one can use the **rust_bpmn_analyzer** natively to provide a model checking web service on port **3001**.

To switch between the implementations one can change the `AnalysisClientModule` **import** in `app.js`.

There are two ways to run the **rust_bpmn_analyzer** webservice for this project:

#### 1. Docker (recommended)

Pull the container image (image is only 4MB compressed):

```bash
docker pull tkra/rust_bpmn_analyzer
```

Run a container on port 3001:

```bash
docker run -p 3001:8080 tkra/rust_bpmn_analyzer
```

#### 2. Running from source using Rust

Clone the [**rust_bpmn_analyzer**](https://github.com/timKraeuter/rust_bpmn_analyzer) and run the following command in the **webserver** subdirectory:

```bash
cargo run -- -p 3001
```

You need to have [Rust installed](https://www.rust-lang.org/tools/install).

## Build the application

To build the application for the **rust_bpmn_analyzer**, you can run the following command:

```bash
npm run build:rust
```

This builds the application for the **rust_bpmn_analyzer**, which is expected to be located next to this project (`/../rust_bpmn_analyzer`).

# Code Linting & Style

For linting I use [eslint](https://eslint.org) and to maintain a consistent code style I use [prettier](https://prettier.io/).
Both are checked using GitHub actions on every code change.

Run eslint and prettier using the following command:

```bash
npm run all
```

# Acknowledgements

I heavily use the excellent bpmn.io ecosystem, i.e., [bpmn-js](https://github.com/bpmn-io/bpmn-js-token-simulation) and [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation).
