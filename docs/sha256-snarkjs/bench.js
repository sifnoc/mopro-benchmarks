const baseUrl = "https://pub-8b08dcae6e0048a8aa6bce1bbf18dfbb.r2.dev";

// Measure the execution time of a given callback
async function measureTime(callback) {
  const start = performance.now();
  const result = await callback();
  const end = performance.now();
  return { result, timeTaken: (end - start) }; // milliseconds
}

function generateRandomKeccakInput() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);

  const bitsArray = [];
  for (let i = 0; i < bytes.length; i++) {
    for (let bit = 7; bit >= 0; bit--) {
      bitsArray.push((bytes[i] >> bit) & 1);
    }
  }

  return { "in": bitsArray }
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
  const iterations = 10;
  let times = [];

  const wasm = await fetch(`${baseUrl}/sha256_512.wasm`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM file: ${response.statusText}`);
      }
      return response.arrayBuffer();
    });
  const zkey = await fetch(`${baseUrl}/sha256_512_final.zkey`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch zkey file: ${response.statusText}`);
      }
      return response.arrayBuffer();
    });


  for (let i = 1; i <= iterations; i++) {
    const input = generateRandomKeccakInput();

    const { timeTaken } = await measureTime(() =>
      window.snarkjs.groth16.fullProve(
        input,
        new Uint8Array(wasm),
        new Uint8Array(zkey))
    );

    addRowToTable("snarkjs-test-results", `Test #${i}`, timeTaken.toFixed(2));

    // Store time for average calculation
    times.push(timeTaken);
  }

  const snarkjsAvg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log("snarkjs proof generation avg time(ms): ", snarkjsAvg);

  addRowToTable("snarkjs-test-results", "Average", snarkjsAvg.toFixed(2));
})();