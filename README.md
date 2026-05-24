# NEWScellauto
2D cellular automata with a Wolfram-style rule string

* Each cell on the grid is either a 1 or 0
* Each cell has four neighbors: North, East, West, South (NEWS)
* The neighborhood of each cell can be written as a 4-bit number from 0 (0000) to 15 (1111)
* a Rule (a 16-bit number) maps each neighborhood to the cell's next value

  You can pause the cellular automata, control it's speed, step it forward

  You can draw on the canvas or set a random pattern

  You can control if the space "wraps around" to the other side
