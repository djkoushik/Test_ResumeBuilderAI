
import { parseResume } from '../services/resumeParser.js';

console.log("Values imported:");
console.log("parseResume:", typeof parseResume);

async function test() {
    try {
        console.log("Attempting to call parseResume with null buffer (expect error but not crash on import)...");
        try {
            await parseResume(Buffer.from("dummy"), "application/pdf");
        } catch (e: any) {
            console.log("Caught expected error:", e.message);
        }
    } catch (err) {
        console.error("CRITICAL: Crash during execution:", err);
    }
}

test();
