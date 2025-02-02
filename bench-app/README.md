# Keccak256 test

The Keccak256 circuit from: https://github.com/zkmopro/circuit-registry/tree/main/keccak256

## Compile

Use snurk for compilation:

```sh

$ ./target/release/snurk --r1cs test-vectors/keccak256_256_test.r1cs --zkey test-vectors/keccak256_256_test_final.zkey --wasm test-vectors/keccak256_256_test.wasm
```

Then move `pkg` into `web-bench`. 

## Test

```sh
web-bench $ yarn && yarn start
```
 
 Check http://localhost:3000 on the browser