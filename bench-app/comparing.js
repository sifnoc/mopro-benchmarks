// Measure the execution time of a given callback
async function measureTime(callback) {
    const start = performance.now();
    const result = await callback();
    const end = performance.now();
    return { result, timeTaken: (end - start) }; // milliseconds
}

async function initializeWasm() {
    try {
        const mopro_wasm = await import('./keccak256-pkg/snurk_wasm.js');
        await mopro_wasm.default();
        await mopro_wasm.initThreadPool(navigator.hardwareConcurrency);
        return mopro_wasm;
    } catch (error) {
        console.error("Failed to initialize WASM module or thread pool:", error);
        throw error;
    }
}

function generateRandomKeccakInput(numBytes = 32, numLimbs = 8) {
    const buf = new Uint8Array(numBytes);
    crypto.getRandomValues(buf);

    let bigVal = 0n;
    for (let i = 0; i < buf.length; i++) {
      bigVal = (bigVal << 8n) | BigInt(buf[i]);
    }
  
    const limbs32 = [];
    for (let i = 0; i < numLimbs; i++) {
      const limb = bigVal & 0xffff_ffffn;
      limbs32.push(Number(limb));
      bigVal >>= 32n;
    }
  
    return [
      [
        "in",
        [ limbs32 ]
      ]
    ];
  }

function addRowToTable(tableBodyId, label, timeMs) {
    const tableBody = document.getElementById(tableBodyId);
    const row = document.createElement("tr");

    const cellLabel = document.createElement("td");
    cellLabel.textContent = label;
    row.appendChild(cellLabel);

    const cellTime = document.createElement("td");
    // Round or format to 2 decimal places
    cellTime.textContent = timeMs;
    row.appendChild(cellTime);

    tableBody.appendChild(row);
}

(async function() {
    // Perfoming wasm bench
    const snurk_wasm = await initializeWasm();

    const iterations = 10;
    const times = [];

    for (let i = 1; i <= iterations; i++) {
        let input = generateRandomKeccakInput(32, 8);

        const { timeTaken } = await measureTime(() =>
            snurk_wasm.prove(JSON.stringify(input))
        );

        addRowToTable("ark-groth16-test-results", `Test #${i}`, timeTaken.toFixed(2));

        // Store time for average calculation
        times.push(timeTaken);
    }

    console.log("times: ", times);
    const wasmAvg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log("avg: ", wasmAvg);

    addRowToTable("ark-groth16-test-results", "Average", wasm-avg.toFixed(2));


    // Perfoming snarkjs bench
    const _snarkjs = import("snarkjs");
    const snarkjs = await _snarkjs;

    times = [];

    const wasm = await fetch("https://github.com/sifnoc/mopro-benchmarks/raw/refs/heads/main/test-vectors/keccak256_256_test.wasm")
    const zkey = await fetch("https://github.com/sifnoc/mopro-benchmarks/raw/refs/heads/main/test-vectors/keccak256_256_test_final.zkey")


    for (let i = 1; i <= iterations; i++) {
      let input = generateRandomKeccakInput(32, 8);

      const { timeTaken } = await measureTime(() =>
        snarkjs.groth16.fullProve(
          input,
          new Uint8Array(wasm),
          new Uint8Array(zkey)) 
      );

      addRowToTable("snarkjs-test-results", `Test #${i}`, timeTaken.toFixed(2));

      // Store time for average calculation
      times.push(timeTaken);
  }

  console.log("times: ", times);
  const snarkjsAvg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log("avg: ", snarkjsAvg);

  addRowToTable("ark-groth16-test-results", "Average", wasm-avg.toFixed(2));

})();