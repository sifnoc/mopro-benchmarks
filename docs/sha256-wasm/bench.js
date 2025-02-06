const baseUrl = "https://pub-8b08dcae6e0048a8aa6bce1bbf18dfbb.r2.dev";

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
    await mopro_wasm.default(`${baseUrl}/sha256-pkg/snurk_wasm_bg.wasm`);
    await mopro_wasm.initThreadPool(navigator.hardwareConcurrency);
    return mopro_wasm;
  } catch (error) {
    console.error("Failed to initialize WASM module or thread pool:", error);
    throw error;
  }
}

// The input will be converted proper size of array in wasm code.
// Please refer to `calculate_witness` fn in circom-compat:
// https://github.com/TheFrozenFire/circom-compat/blob/e7c5c4c8b9803b9a71e36b0210491a43e19e1914/src/witness/witness_calculator.rs#L110
function generateRandomKeccakInput() {
  const buf = new Uint8Array(64);
  crypto.getRandomValues(buf);

  let bigVal = 0n;
  for (let i = 0; i < buf.length; i++) {
    bigVal = (bigVal << 8n) | BigInt(buf[i]);
  }

  const limbs32 = [];
  for (let i = 0; i < 8; i++) {
    const limb = bigVal & 0xffff_ffffn;
    limbs32.push(Number(limb));
    bigVal >>= 32n;
  }

  return [
    [
      "in",
      [limbs32]
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

(async function () {
  // Perfoming wasm bench
  const snurk_wasm = await initializeWasm();

  const iterations = 10;
  let times = [];

  for (let i = 1; i <= iterations; i++) {
    let input = generateRandomKeccakInput();

    const { timeTaken } = await measureTime(
      () =>
        snurk_wasm.prove(JSON.stringify(input))
    );

    addRowToTable("ark-groth16-test-results", `Test #${i}`, timeTaken.toFixed(2));

    // Store time for average calculation
    times.push(timeTaken);
  }

  const wasmAvg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log("wasm proof generation avg time(ms): ", wasmAvg);

  addRowToTable("ark-groth16-test-results", "Average", wasmAvg.toFixed(2));
})();