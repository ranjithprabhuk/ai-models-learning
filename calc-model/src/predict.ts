import { CalculatorModel } from './calculator-model';
import * as readline from 'readline';

async function main() {
  console.log('🔢 AI Calculator - Prediction Mode');
  console.log('==================================');

  const model = new CalculatorModel();

  // Try to load existing model
  const modelLoaded = model.loadModel();

  if (!modelLoaded) {
    console.log('❌ No trained model found!');
    console.log('📚 Please train the model first by running: pnpm run train');
    process.exit(1);
  }

  console.log('✅ Model loaded successfully!');
  console.log('\n📝 Examples you can try:');
  console.log('  • "2+2"');
  console.log('  • "what is 8 times 9"');
  console.log('  • "8 square"');
  console.log('  • "what is 2 power 2"');
  console.log('  • "what will I get if I add 7 with 3"');
  console.log('  • "subtract 4 from 10"');
  console.log('\n💡 Type "exit" to quit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question('🤖 Enter a math question: ', (input) => {
      if (input.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }

      if (!input.trim()) {
        console.log('⚠️  Please enter a math question.');
        askQuestion();
        return;
      }

      try {
        const result = model.predict(input.trim());
        console.log(`🎯 Result: ${result}\n`);
      } catch (error) {
        console.log(`❌ Error: ${error}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Also provide a single prediction function for testing
export function predictSingle(input: string): void {
  const model = new CalculatorModel();

  if (!model.loadModel()) {
    console.log('❌ No trained model found! Please train the model first.');
    return;
  }

  try {
    const result = model.predict(input);
    console.log(`Input: "${input}"`);
    console.log(`Result: ${result}`);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

// Run interactive mode if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
