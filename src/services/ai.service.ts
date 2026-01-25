
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // In a real extension, we would get this from configuration
    this.genAI = new GoogleGenerativeAI('INSERT_API_KEY_HERE');
  }

  async generateTasksForProject(projectDescription: string): Promise<string[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const prompt = `Generate a list of 5-7 concrete, actionable development tasks for a software project described as: "${projectDescription}". Return as a JSON array of strings. Keep them brief.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const prompt = `List 3 sub-steps to complete the coding task: "${taskTitle}". Return as a JSON array of strings.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) return [];
      const subtasks = JSON.parse(text);
      return Array.isArray(subtasks) ? subtasks : [];
    } catch (e) {
      console.error('Gemini Suggest Error:', e);
      return [];
    }
  }
}
