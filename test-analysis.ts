// Test script to verify OpenAI analysis functions
import { analyzeWritingStyle } from "./server/openai";

async function testAnalysis() {
  console.log("Testing OpenAI Analysis Functions...");
  
  try {
    // Test style analysis with sample data
    const testRequest = {
      documents: [
        {
          id: "test-1",
          title: "Chapter 1",
          content: "The rain fell in sheets against the cracked windows of the old mansion, each droplet drumming a chaotic rhythm that echoed through the empty halls. Detective Sarah Morrison stood in the grand foyer, her breath visible in the cold air, studying the scene before her with practiced eyes. The body lay sprawled across the marble floor, a dark pool spreading beneath it like spilled ink on parchment. She had seen death before, countless times in her twenty years on the force, but something about this scene felt different, wrong in a way she couldn't quite articulate."
        },
        {
          id: "test-2", 
          title: "Chapter 2",
          content: "The morning sun struggled to break through the heavy clouds as Detective Morrison returned to the Blackwood estate. She had spent the night reviewing the preliminary forensics report, and several inconsistencies had emerged that warranted further investigation. The butler, Mr. Henderson, greeted her at the door with the same stoic expression he had worn the day before. She followed him through the labyrinthine corridors, noting how the portraits on the walls seemed to watch her progress with painted eyes that held secrets of their own."
        }
      ],
      projectContext: "Mystery Novel"
    };
    
    console.log("Calling analyzeWritingStyle...");
    const result = await analyzeWritingStyle(testRequest);
    
    console.log("Analysis completed!");
    console.log("Success:", result.success);
    console.log("Data keys:", Object.keys(result.data));
    console.log("Recommendations:", result.recommendations);
    console.log("\nFull result:");
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testAnalysis().catch(console.error);