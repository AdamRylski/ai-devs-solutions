// Add your type definitions here
export interface Message {
  text: string;
  msgID: number;
}

export interface Task {
  code: number;
  msg: string;
  token?: string;
  // Add other task-specific fields as needed
}

export interface VerificationResponse extends Message {
  // Extends Message interface as the response has the same structure
} 