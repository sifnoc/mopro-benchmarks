# Mopro Benchmarks

For comparing the performance of Ark-Groth16 and SnarkJS.

## Setup

1. Fetch submodules

    ```sh
        git submodule update --init
    ```

2. Compile circuits

    Example circuits can be found in the [circuit-registry](./circuit-registry/).
    Please follow the instructions in the [README](./circuit-registry/README.md) within the circuit-registry for generating circuits.

3. Generate Wasm packages

   You can generate WASM files using [snurk](./snurk/) by following the instructions in the [README](./snurk/README.md).
   For example, after compiling the keccak256 circuit with circom and obtaining the **r1cs**, **wasm**, and **zkey** files, you can generate the WASM prover using commands like:
   ```sh
    $ ./snurk/target/release/snurk \
    --r1cs circuit-registry/keccak256/target/keccak256_256_test.r1cs \
    --wasm circuit-registry/keccak256/target/keccak256_256_test_js/keccak256_256_test.wasm \
    --zkey circuit-registry/keccak256/target/keccak256_256_test_final.zkey
    ```

    These generated files have been uploaded to the [bench-app/test-vectors](./bench-app/test-vectors/) directory.