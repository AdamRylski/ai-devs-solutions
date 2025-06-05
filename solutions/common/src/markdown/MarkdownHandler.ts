/**
 * Utility class for handling markdown text operations
 */
export class MarkdownHandler {
  /**
   * Removes all comments from markdown text, including HTML comments and block comments
   * @param markdown - The markdown text to process
   * @returns The markdown text with all comments removed
   */
  public static removeComments(markdown: string): string {
    if (!markdown) {
      return '';
    }

    // Remove HTML comments <!-- comment -->
    let processedText = markdown.replace(/<!--[\s\S]*?-->/g, '');

    // Remove block comments /* comment */
    processedText = processedText.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single line comments // comment
    processedText = processedText.replace(/\/\/.*$/gm, '');

    return processedText.trim();
  }
}
