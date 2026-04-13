# NFA to DFA Subset Construction Visualizer

### Project Title
NFA to DFA Converter and Visualizer using Subset Construction

### Course Context
Theory of Automata Lab (TAFL)

### Problem Statement
Manual NFA to DFA conversion is often error-prone, especially when epsilon-closures and multiple reachable subsets are involved. The project provides an interactive tool that performs conversion step by step and helps students verify each transition visually.

### Project Objective
- Implement subset construction for converting an NFA into an equivalent DFA.
- Support epsilon transitions using eps or epsilon notation.
- Display both automata as graphs and tables for quick validation.
- Provide stepwise exploration so learners can understand how each DFA state is generated.

### Tools and Technology
- HTML5
- CSS3
- JavaScript (Vanilla)
- SVG for graph rendering

### Core Implementation
- NFA parser for structured text input:
  - States
  - Alphabet
  - Start state
  - Accepting states
  - Transitions
- Validation checks for undefined states and invalid transition symbols.
- Epsilon-closure and move operations.
- BFS-style subset construction to generate DFA states and transitions.
- Dynamic SVG drawing for NFA and DFA.
- Transition table generation for both machines.

### Key Features Delivered
- Landing page shows hardcoded sample NFA input.
- Landing page shows original NFA graph and NFA table only.
- DFA graph/table and construction steps appear after parsing.
- Step controls:
  - Next Step
  - Run All
- Textbook-style navigation between runs:
  - Prev and Next buttons
  - Preserves run-wise progress
- Dead/empty DFA subset displayed as {qd}.
- Crowded DFA nodes (4 or more states) are enlarged for better readability.

### How to Run
1. Open index.html in any modern browser.
2. Edit NFA definition in the input panel.
3. Click Parse NFA.
4. The NFA input can be changed by changing the values in States,Alphabets, Start, Accepting(Final), Transitions.
5. Use Next Step or Run All to view conversion progress.
6. Use Prev or Next to move between saved conversion runs.

### Live Demo
https://nfa-dfa-visualizer-lyart.vercel.app/

### Expected Learning Outcomes
- Understand epsilon-closure and move operations practically.
- Learn subset construction flow from start subset to full DFA.
- Interpret automata transitions through both graph and table views.

### Conclusion
This project successfully demonstrates NFA to DFA conversion in an educational, visual, and step-driven format. 
