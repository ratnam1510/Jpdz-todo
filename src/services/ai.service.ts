
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    // In a real extension, we would get this from configuration
    this.ai = new GoogleGenAI({ apiKey: 'INSERT_API_KEY_HERE' });
  }

  async generateTasksForProject(projectDescription: string): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a list of 5-7 concrete, actionable development tasks for a software project described as: "${projectDescription}". Keep them brief.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];

      const tasks = JSON.parse(text);
      return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      console.error('Gemini API Error:', e);
      return ['Failed to generate tasks. Please try again.'];
    }
  }

  async suggestSubtasks(taskTitle: string): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `List 3 sub-steps to complete the coding task: "${taskTitle}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  }
}
