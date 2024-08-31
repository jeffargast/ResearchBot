# OpenAI GPT-4 Topic Explorer

A Node.js script that uses OpenAI's GPT-4 API to explore and learn about a given topic through iterative questioning.

## Features

- Generates initial information about a specified topic
- Iteratively generates follow-up questions and answers
- Uses markdown formatting for output
- Provides references as links in the responses

## Requirements

- Node.js
- OpenAI API key

## Setup

1. Set the OPENAI_API_KEY environment variable with your OpenAI API key.
2. No additional packages are needed to install, just node.

## Usage

```
node bot.js <topic> <numIterations>
```

- `<topic>`: The subject you want to explore
- `<numIterations>`: Number of question-answer iterations

## Example

```
node bot.js "quantum computing" 3
```

This will generate initial information about quantum computing, followed by 3 rounds of questions and answers.
