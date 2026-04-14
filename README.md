# NFA to DFA Subset Construction Visualizer

### Project Title
NFA to DFA Converter and Visualizer using Subset Construction

### Course Context
Theory of Automata Lab (TAFL)

### Problem Statement
The conversion of a nondeterministic finite automaton (NFA) into an equivalent deterministic finite automaton (DFA) is a fundamental topic in automata theory. However, manual conversion becomes complex and error-prone, particularly in the presence of epsilon transitions and multiple reachable subsets. This project provides a structured visual tool for performing the conversion and verifying each generated DFA state and transition.

### Project Objective
- To implement the subset construction algorithm for NFA to DFA conversion.
- To support epsilon transitions using `eps` or `epsilon` notation.
- To represent both NFA and DFA in graphical and tabular formats.
- To show the construction process step by step for instructional use.

### Tech Stack
- HTML5
- CSS3
- JavaScript (Vanilla)
- SVG for graph rendering

### Methodology / Approach
The project implements the standard subset construction algorithm to convert a nondeterministic finite automaton (NFA) into an equivalent deterministic finite automaton (DFA).
1. Each DFA state represents a subset of NFA states.
2. The algorithm begins with the initial subset, derived from the NFA start state.
3. For each subset and input symbol, the set of reachable states is computed using the transition function.
4. If epsilon transitions are present, the reachable states are expanded using epsilon-closure.
5. Newly generated subsets are treated as DFA states and processed iteratively.
6. A breadth-first search (BFS) approach is used to ensure all reachable subsets are explored.
7. Any subset containing at least one accepting NFA state is marked as an accepting DFA state.

### Core Implementation
- The NFA is provided in a structured textual format including states, alphabet, start state, accepting states, and transitions.
- A parser validates and processes the input before conversion.
- Epsilon-closure and move operations are applied iteratively during subset construction.
- A BFS-based approach ensures all reachable DFA states are generated.
- The resulting automata are displayed using dynamic graphs and transition tables.

### Key Features Delivered
- Structured parsing of NFA input.
- Validation of states, symbols, and transitions.
- Stepwise visualization of subset construction.
- Graphical rendering of NFA and DFA using SVG.
- Transition tables for both automata.
- Representation of dead/empty state as {qd}.
- Navigation across multiple conversion runs.

### How to Run
1. Open index.html in a modern web browser.
2. Modify the NFA definition in the input panel if required.
3. Click Parse NFA to process the input.
4. Use Next Step for step-by-step execution or Run All for full conversion.
5. Use Prev and Next to navigate between saved runs.

### Live Demo
https://nfa-dfa-visualizer-lyart.vercel.app/

### Expected Learning Outcomes
- Understand epsilon-closure and move operations practically.
- Learn subset construction flow from start subset to full DFA.
- Interpret automata transitions through both graph and table views.

### Conclusion
This project demonstrates the conversion of an NFA to an equivalent DFA through subset construction in a clear and instructional manner. It serves as a useful academic aid for studying the core concepts of automata theory.
