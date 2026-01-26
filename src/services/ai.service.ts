import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    // API key will be configured by user in VS Code settings when feature is implemented
    // For now, this service is a placeholder for future AI features
  }

  async generateTasksForProject(projectDescription: string): Promise<string[]> {
    if (!this.genAI) {
      return ['AI features not configured. Add your API key in VS Code settings.'];
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `Generate a list of 5-7 concrete, actionable development tasks for a software project described as: "${projectDescription}". Return as a JSON array of strings. Keep them brief.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) return [];

      const tasks = JSON.parse(text);
      return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      // Return user-friendly error message
      return ['Failed to generate tasks. Please check your API configuration.'];
    }
  }

  async suggestSubtasks(taskTitle: string): Promise<string[]> {
    if (!this.genAI) {
      return [];
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `List 3 sub-steps to complete the coding task: "${taskTitle}". Return as a JSON array of strings.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) return [];
      const subtasks = JSON.parse(text);
      return Array.isArray(subtasks) ? subtasks : [];
    } catch (e) {
      // Silently fail for optional feature
      return [];
    }
  }
}
