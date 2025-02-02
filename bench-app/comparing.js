// Measure the execution time of a given callback
async function measureTime(callback) {
    const start = performance.now();
    const result = await callback();
    const end = performance.now();
    return { result, timeTaken: (end - start) }; // milliseconds
}

async function initializeWasm() {
    try {
        const mopro_wasm = await import('./pkg/snurk_wasm.js');
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
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log("avg: ", avg);

    addRowToTable("ark-groth16-test-results", "Average", avg.toFixed(2));
})();