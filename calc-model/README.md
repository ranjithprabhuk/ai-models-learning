# AI Calculator Model

An AI-powered natural language calculator built with Node.js, TypeScript, and Brain.js. This project demonstrates how to build and train a neural network from scratch to understand natural language math queries and provide accurate calculations.

## Features

- 🧠 **Neural Network**: Built using Brain.js for natural language processing
- 📝 **Natural Language Understanding**: Accepts math queries in plain English
- ⚡ **Real-time Predictions**: Interactive calculator interface
- 🎯 **High Accuracy**: Trained on diverse mathematical expressions
- 🔧 **TypeScript**: Full type safety and modern JavaScript features

## Supported Operations

The AI calculator can understand and process:

### Basic Operations

- Addition: `2+2`, `"what is 2 plus 2"`, `"add 3 and 5"`
- Subtraction: `10-5`, `"subtract 4 from 10"`, `"take 3 from 8"`
- Multiplication: `8*9`, `"what is 8 times 9"`, `"multiply 4 by 5"`
- Division: `10/2`, `"divide 10 by 2"`, `"15 divided by 3"`

### Power Operations

- Squares: `"8 square"`, `"4 squared"`, `3^2`
- Powers: `"what is 2 power 2"`, `"2 to the power of 3"`

### Natural Language Variations

- `"what will I get if I add 7 with 3"` → 10
- `"what is 2 into 2"` → 4
- `"sum of 4 and 6"` → 10
- Word numbers: `"two plus two"`, `"five times six"`

## Installation

1. **Navigate to the project directory:**

   ```bash
   cd calc-model
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

## Usage

### 1. Train the Model

Before making predictions, you need to train the neural network:

```bash
pnpm run train
```

This will:

- Load the training data (70+ examples)
- Train the neural network
- Save the trained model to `model.json`
- Run test predictions to verify accuracy

**Training Output Example:**

```
🧠 AI Calculator - Training Mode
================================
Preparing training data...
Training with 70 examples...
Sample training data:
1. Input: "2+2" -> Tokens: [0.2, 0.1, 0.2, 0, 0...] -> Output: 4
...
Training completed!
Final error: 0.003
Iterations: 1547
Model saved to model.json
```

### 2. Make Predictions

After training, you can use the calculator in interactive mode:

```bash
pnpm start
# or
pnpm run predict
```

**Interactive Session Example:**

```
🔢 AI Calculator - Prediction Mode
==================================
✅ Model loaded successfully!

📝 Examples you can try:
  • "2+2"
  • "what is 8 times 9"
  • "8 square"
  • "what is 2 power 2"
  • "what will I get if I add 7 with 3"
  • "subtract 4 from 10"

💡 Type "exit" to quit

🤖 Enter a math question: what is 5 times 3
🎯 Result: 15

🤖 Enter a math question: 8 square
🎯 Result: 64

🤖 Enter a math question: exit
👋 Goodbye!
```

### 3. Development Mode

For development with automatic TypeScript compilation:

```bash
# Train the model in development mode
pnpm run dev:train

# Run predictions in development mode
pnpm run dev
```

## Project Structure

```
calc-model/
├── src/
│   ├── calculator-model.ts    # Main neural network model class
│   ├── preprocessor.ts        # Text preprocessing utilities
│   ├── training-data.ts       # Training dataset
│   ├── train.ts              # Training script
│   └── predict.ts            # Prediction script
├── dist/                     # Compiled JavaScript (generated)
├── model.json               # Trained model (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

### 1. Text Preprocessing

The `TextPreprocessor` class handles:

- Converting natural language to mathematical expressions
- Normalizing word numbers (`"two"` → `"2"`)
- Mapping operation words (`"plus"` → `"+"`, `"times"` → `"*"`)
- Tokenizing text into numerical arrays for the neural network

### 2. Neural Network Architecture

- **Input Layer**: 20 neurons (tokenized text representation)
- **Hidden Layers**: [20, 15, 10] neurons with sigmoid activation
- **Output Layer**: 1 neuron (normalized result)
- **Learning Rate**: 0.3
- **Training Iterations**: Up to 2000 (with early stopping)

### 3. Training Process

1. Load 70+ training examples with natural language inputs and numerical outputs
2. Preprocess and tokenize all input text
3. Normalize outputs to 0-1 range for better training
4. Train neural network with backpropagation
5. Save trained model to JSON file

### 4. Prediction Process

1. Preprocess user input using the same tokenization
2. Run tokenized input through trained neural network
3. Denormalize output back to numerical result
4. Return final calculation

## Training Data

The model is trained on 70+ examples including:

- Basic arithmetic operations
- Natural language variations
- Word numbers
- Multiple ways to express the same operation
- Edge cases (operations with 0, 1, etc.)

## Example Inputs and Outputs

| Input                                 | Expected Output |
| ------------------------------------- | --------------- |
| `"2+2"`                               | 4               |
| `"what is 8 times 9"`                 | 72              |
| `"8 square"`                          | 64              |
| `"what is 2 power 2"`                 | 4               |
| `"what will I get if I add 7 with 3"` | 10              |
| `"subtract 4 from 10"`                | 6               |
| `"two plus two"`                      | 4               |
| `"divide 15 by 3"`                    | 5               |

## Technical Details

### Dependencies

- **brain.js**: Neural network library for JavaScript
- **natural**: Natural language processing utilities
- **typescript**: Static type checking
- **ts-node**: TypeScript execution for development

### Model Performance

- Training typically converges in 1000-2000 iterations
- Final training error usually < 0.005
- High accuracy on basic arithmetic operations
- Good generalization to unseen natural language variations

## Troubleshooting

### Common Issues

1. **"No trained model found" error**

   - Solution: Run `pnpm run train` first

2. **Poor prediction accuracy**

   - Solution: Retrain the model with `pnpm run train`
   - Check if your input format matches training examples

3. **Installation issues**
   - Ensure Node.js version 14+ is installed
   - Clear pnpm cache: `pnpm store prune`
   - Delete `node_modules` and run `pnpm install` again

### Performance Tips

- The model works best with inputs similar to the training data
- For better accuracy, add more training examples in `training-data.ts`
- Retrain the model after adding new training data

## Contributing

To add new mathematical operations or improve accuracy:

1. Add training examples to `src/training-data.ts`
2. Update the preprocessor in `src/preprocessor.ts` if needed
3. Retrain the model: `pnpm run train`
4. Test with new examples: `pnpm run predict`

## License

MIT License - feel free to use this project for learning and experimentation!
