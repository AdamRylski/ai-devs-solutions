export interface Question {
    question: string;
    answer: string;
}

export interface ProcessedData {
    questions: Question[];
}

export interface ApiResponse {
    code: number;
    msg: string;
    answer?: string;
    note?: string;
} 