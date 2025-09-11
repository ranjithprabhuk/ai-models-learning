export interface TrainingExample {
  input: string;
  output: number;
}

export class TextPreprocessor {
  private static numberWords: { [key: string]: string } = {
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    eleven: '11',
    twelve: '12',
    thirteen: '13',
    fourteen: '14',
    fifteen: '15',
    sixteen: '16',
    seventeen: '17',
    eighteen: '18',
    nineteen: '19',
    twenty: '20',
  };

  private static operationWords: { [key: string]: string } = {
    plus: '+',
    add: '+',
    added: '+',
    sum: '+',
    into: '+',
    minus: '-',
    subtract: '-',
    take: '-',
    from: '-',
    times: '*',
    multiply: '*',
    multiplied: '*',
    by: '*',
    divide: '/',
    divided: '/',
    over: '/',
    power: '^',
    raised: '^',
    square: '^2',
    squared: '^2',
  };

  static preprocess(text: string): string {
    // Convert to lowercase and remove extra spaces
    let processed = text.toLowerCase().trim().replace(/\s+/g, ' ');

    // Remove common question words and phrases
    processed = processed.replace(/^(what is|what will i get if|what's|whats|calculate|find)/g, '');
    processed = processed.replace(/(please|kindly|\?|\.)/g, '');

    // Replace number words with digits
    Object.entries(this.numberWords).forEach(([word, digit]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      processed = processed.replace(regex, digit);
    });

    // Replace operation words with symbols
    Object.entries(this.operationWords).forEach(([word, symbol]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      processed = processed.replace(regex, symbol);
    });

    // Handle special patterns
    processed = processed.replace(/(\d+)\s+with\s+(\d+)/g, '$1 + $2');
    processed = processed.replace(/(\d+)\s+and\s+(\d+)/g, '$1 + $2');
    processed = processed.replace(/(\d+)\s+\^\s*2/g, '$1^2'); // Handle "5 square" -> "5^2"

    // Clean up extra spaces
    processed = processed.trim().replace(/\s+/g, ' ');

    return processed;
  }

  static tokenize(text: string): number[] {
    const processed = this.preprocess(text);

    // Simplified encoding scheme for better learning
    const tokens: number[] = [];
    const maxLength = 15; // Shorter for better learning

    for (let i = 0; i < maxLength; i++) {
      if (i < processed.length) {
        const char = processed[i];
        if (char >= '0' && char <= '9') {
          // Numbers: map 0-9 to 0.1-1.0
          const num = parseFloat(char);
          tokens.push((num + 1) / 10); // 0->0.1, 1->0.2, ..., 9->1.0
        } else if (char === '+') {
          tokens.push(0.91);
        } else if (char === '-') {
          tokens.push(0.92);
        } else if (char === '*') {
          tokens.push(0.93);
        } else if (char === '/') {
          tokens.push(0.94);
        } else if (char === '^') {
          tokens.push(0.95);
        } else if (char === ' ') {
          tokens.push(0.01);
        } else {
          tokens.push(0.02); // Other characters
        }
      } else {
        tokens.push(0); // Padding
      }
    }

    return tokens;
  }
}

export class MathEvaluator {
  static evaluate(expression: string): number {
    try {
      // Safety check - only allow basic math operations
      if (!/^[\d\+\-\*\/\^\.\s\(\)]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }

      // Handle power operations (^)
      let processedExpression = expression.replace(/(\d+)\^(\d+)/g, 'Math.pow($1, $2)');

      // Use Function constructor for safe evaluation
      return Function(`"use strict"; return (${processedExpression})`)();
    } catch (error) {
      console.error('Error evaluating expression:', expression, error);
      return 0;
    }
  }
}
