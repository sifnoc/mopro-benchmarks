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
        await mopro_wasm.default(`${baseUrl}/semaphore32-pkg/snurk_wasm_bg.wasm`);
        await mopro_wasm.initThreadPool(navigator.hardwareConcurrency);
        return mopro_wasm;
    } catch (error) {
        console.error("Failed to initialize WASM module or thread pool:", error);
        throw error;
    }
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

function splitToU32Limbs(bigNumberStr) {
    let bigIntValue = BigInt(bigNumberStr);

    let limbs32 = [];
    for (let i = 0; i < 8; i++) {
        const limb = bigIntValue & 0xffff_ffffn;
        limbs32.push(Number(limb));
        bigIntValue >>= 32n;
    }

    if (limbs32.length === 0) limbs32.push(0);
    return limbs32;
}


function transformJsonToU32Array(jsonInput) {
    return Object.entries(jsonInput).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(str => splitToU32Limbs(str)) : [splitToU32Limbs(value)]
    ]);
}

(async function () {
    // Perfoming wasm bench
    const snurk_wasm = await initializeWasm();

    const response = await fetch("./input.json");
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const input = await response.json();

    const iterations = 10;
    let times = [];

    for (let i = 1; i <= iterations; i++) {
        const { timeTaken } = await measureTime(
            () =>
                snurk_wasm.prove(JSON.stringify(transformJsonToU32Array(input)))
        );

        addRowToTable("ark-groth16-test-results", `Test #${i}`, timeTaken.toFixed(2));

        // Store time for average calculation
        times.push(timeTaken);
    }

    const wasmAvg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log("wasm proof generation avg time(ms): ", wasmAvg);

    addRowToTable("ark-groth16-test-results", "Average", wasmAvg.toFixed(2));
})();