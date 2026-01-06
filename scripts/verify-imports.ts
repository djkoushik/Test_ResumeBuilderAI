
// Only test the deep import. Do NOT import resumeParser (which uses the bad import)
try {
    console.log("Importing deep...");
    // @ts-ignore
    import('pdf-parse/lib/pdf-parse.js').then((mod) => {
        console.log("Deep import success!", mod.default ? "Has default" : "No default");

        // Test it
        const pdf = mod.default || mod;
        console.log("PDF function type:", typeof pdf);

        pdf(Buffer.from("dummy")).then(() => {
            console.log("Execution success (or at least no crash on init)");
        }).catch(err => {
            console.log("Execution error (expected for dummy buffer):", err.message);
        });

    }).catch(err => {
        console.error("Deep import failed:", err);
    });
} catch (e) {
    console.error("Sync error:", e);
}
