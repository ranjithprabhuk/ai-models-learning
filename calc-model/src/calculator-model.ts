import * as brain from 'brain.js';
import { TextPreprocessor } from './preprocessor';
import { trainingData } from './training-data';
import * as fs from 'fs';
import * as path from 'path';

export class CalculatorModel {
  private network: brain.NeuralNetwork;
  private modelPath: string;

  constructor() {
    this.network = new brain.NeuralNetwork({
      hiddenLayers: [15, 10], // Simpler architecture for better learning
      activation: 'sigmoid',
    });
    this.modelPath = path.join(__dirname, '..', 'model.json');
  }

  async train(): Promise<void> {
    console.log('Preparing training data...');

    // Convert training data to neural network format
    const networkData = trainingData.map((example) => ({
      input: TextPreprocessor.tokenize(example.input),
      output: { result: example.output / 100 }, // Use object format for brain.js v1.6.1
    }));

    console.log(`Training with ${networkData.length} examples...`);
    console.log('Sample training data:');
    networkData.slice(0, 3).forEach((data, index) => {
      console.log(
        `${index + 1}. Input: "${trainingData[index].input}" -> Tokens: [${data.input
          .slice(0, 5)
          .join(', ')}...] -> Output: ${trainingData[index].output}`
      );
    });

    const trainResult = this.network.train(networkData, {
      iterations: 3000,
      errorThresh: 0.001,
      log: true,
      logPeriod: 200,
      learningRate: 0.5,
    });

    console.log('Training completed!');
    console.log(`Final error: ${trainResult.error}`);
    console.log(`Iterations: ${trainResult.iterations}`);

    // Save the trained model
    this.saveModel();

    // Test the model with some examples
    console.log('\nTesting trained model:');
    this.testModel();
  }

  private testModel(): void {
    const testCases = ['2+2', 'what is 5 times 3', '8 square', 'subtract 4 from 10', 'what is 2 power 3'];

    testCases.forEach((testCase) => {
      const prediction = this.predict(testCase);
      const expected = this.getExpectedResult(testCase);
      console.log(`Input: "${testCase}" -> Predicted: ${prediction}, Expected: ${expected}`);
    });
  }

  private getExpectedResult(input: string): number {
    const found = trainingData.find((data) => data.input.toLowerCase() === input.toLowerCase());
    return found ? found.output : 0;
  }

  predict(input: string): number {
    const tokens = TextPreprocessor.tokenize(input);
    const output = this.network.run(tokens);

    // Handle object output format for brain.js v1.6.1
    let normalizedOutput: number;
    if (typeof output === 'object' && (output as any).result !== undefined) {
      normalizedOutput = (output as any).result;
    } else if (Array.isArray(output)) {
      normalizedOutput = output[0];
    } else {
      normalizedOutput = output as number;
    }

    // Denormalize the output
    const result = Math.round(normalizedOutput * 100);
    return result;
  }

  saveModel(): void {
    try {
      const modelData = this.network.toJSON();
      fs.writeFileSync(this.modelPath, JSON.stringify(modelData, null, 2));
      console.log(`Model saved to ${this.modelPath}`);
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  loadModel(): boolean {
    try {
      if (fs.existsSync(this.modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
        this.network.fromJSON(modelData);
        console.log(`Model loaded from ${this.modelPath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
}
