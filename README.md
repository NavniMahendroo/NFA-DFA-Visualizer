# NFA → DFA Subset Construction Visualizer

Open `index.html` in a browser to run the visualizer locally (double-click or use a simple static server).

Usage:
- Edit the NFA in the left pane. Syntax:
  - `States: q0,q1,q2`
  - `Alphabet: a,b` (do not include `eps` here)
  - `Start: q0`
  - `Accepting: q2`
  - `Transitions:` then lines like `q0,a->q1,q2` or `q0,eps->q2` for epsilon
- Click `Parse NFA` to run subset construction. Use `Next Step` to step through or `Run All` to complete.

The app draws simple SVG graphs for the NFA and the generated DFA and displays the DFA transition table.
# NFA-DFA-Visualizer
