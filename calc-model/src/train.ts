import { CalculatorModel } from './calculator-model';

async function main() {
  console.log('🧠 AI Calculator - Training Mode');
  console.log('================================');

  const model = new CalculatorModel();

  try {
    await model.train();
    console.log('\n✅ Training completed successfully!');
    console.log('📁 Model saved to model.json');
    console.log('\n🚀 You can now run predictions using: pnpm run predict');
  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
