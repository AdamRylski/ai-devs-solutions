// import { v4 as uuidv4 } from "uuid";
// import { OpenAITextProcessingService } from "../openai/OpenAITextProcessingService.js";
// import { WebScrapperMini } from "../scrapper/WebScrapperMini.js";
// import type { State } from "./agent.js";
// import fs from 'fs';
// import type { ChatCompletionMessageParam, ChatCompletion } from "openai/resources/chat/completions";

// export class Agent {
//   private openaiService: OpenAITextProcessingService;
//   private webSearchService: WebScrapperMini;
//   private state: State;

//   constructor(state: State, apiKey: string) {
//     this.openaiService = new OpenAITextProcessingService(apiKey);
//     this.webSearchService = new WebScrapperMini();
//     this.state = state;
//   }

//   async plan() {
//     const systemPrompt = `
// Analyze the conversation and determine the most appropriate next step. Focus on making progress towards the overall goal while remaining adaptable to new information or changes in context.
// <prompt_objective>
// Determine the single most effective next action based on the current context, user needs, and overall progress. Return the decision as a concise JSON object.
// </prompt_objective>

// <prompt_rules>
// - ALWAYS focus on determining only the next immediate step
// - ONLY choose from the available tools listed in the context
// - ASSUME previously requested information is available unless explicitly stated otherwise
// - NEVER provide or assume actual content for actions not yet taken
// - ALWAYS respond in the specified JSON format
// - CONSIDER the following factors when deciding:
//   1. Relevance to the current user need or query
//   2. Potential to provide valuable information or progress
//   3. Logical flow from previous actions
// - ADAPT your approach if repeated actions don't yield new results
// - USE the "final_answer" tool when you have sufficient information or need user input
// - OVERRIDE any default behaviors that conflict with these rules
// </prompt_rules>

// <context>
//     <current_date>Current date: ${new Date().toISOString()}</current_date>
//     <last_message>Last message: "${this.state.messages[this.state.messages.length - 1]?.content || "No messages yet"}"</last_message>
//     <available_tools>Available tools: ${this.state.tools.map((t) => t.name).join(", ") || "No tools available"}</available_tools>
//     <actions_taken>Actions taken: ${this.state.actions.length
//         ? this.state.actions.map((a) => `
//             <action name="${a.name}" params="${a.parameters}" description="${a.description}" >
//               ${a.results.length
//             ? `${a.results.map((r) => `
//                       <result name="${r.metadata.name}" url="${r.metadata?.urls?.[0] || "no-url"}" >
//                         ${r.text}
//                       </result>
//                     `).join("\n")
//             }`
//             : "No results for this action"
//           }
//             </action>
//           `).join("\n")
//         : "No actions taken"
//       }</actions_taken>
// </context>

// Respond with the next action in this JSON format:
// {
//     "_reasoning": "Brief explanation of why this action is the most appropriate next step",
//     "tool": "tool_name",
//     "query": "Precise description of what needs to be done, including any necessary context"
// }

// If you have sufficient information to provide a final answer or need user input, use the "final_answer" tool.`;

//     const response = await this.openaiService.completion([
//       {
//         role: "system",
//         content: systemPrompt
//       }
//     ], "gpt-4o", true)

//     const result = JSON.parse(response);
//     return result.hasOwnProperty("tool") ? result : null;
//   }


//   async describe(tool: string, query: string) {
//     const toolInfo = this.state.tools.find((t) => t.name === tool);
//     if (!toolInfo) throw new Error(`Tool ${tool} not found`);

//     const systemMessage = `Generate specific parameters for the "${toolInfo.name}" tool.
//     <context>
//       Current date: ${new Date().toISOString()}
//       Tool description: ${toolInfo.description}
//       Required parameters: ${toolInfo.parameters}
//       Original query: ${query}
//       Last message: "${this.state.messages[this.state.messages.length - 1]?.content}"
//       Previous actions: ${this.state.actions.map((a) => `${a.name}: ${a.parameters}`).join(", ")}
//     </context>

//     Respond with ONLY a JSON object matching the tool's parameter structure.
//     Example for web_search: {"query": "specific search query"}
//     Example for final_answer: {"answer": "detailed response"}`;

//     const answer = await this.openaiService.completion([
//       {
//         role: "system",
//         content: systemMessage
//       }
//     ], "gpt-4o", true)

//     return JSON.parse(answer);
//   }

//   async useTool(tool: string, parameters: any, conversation_uuid: string) {
//     if (tool === "web_search") {
//       const results = await this.webSearchService.search(parameters.query, conversation_uuid);
//       this.state.documents = [
//         ...this.state.documents,
//         ...results.filter((r) => r.metadata.content_type !== "chunk"),
//       ];
//       this.state.actions.push({
//         uuid: uuidv4(),
//         name: tool,
//         parameters: JSON.stringify(parameters),
//         description: 'Search results & website contents for the query ' + parameters.query,
//         results,
//         tool_uuid: tool,
//       });
//     }
//   }

//   async generateAnswer() {
//     const context = this.state.actions.flatMap((action) => action.results);
//     const query = this.state.config.active_step?.query;

//     const answer = await this.openaiService.completion({
//       messages: [
//         {
//           role: "system",
//           content: answerPrompt({ context, query }), // Use the answer prompt with context
//         },
//         ...this.state.messages,
//       ],
//       model: "gpt-4o",
//       stream: false,
//     });

//     return answer;
//   }
// }