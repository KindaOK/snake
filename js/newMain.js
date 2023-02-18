const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const INPUTS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

let lastInput = INPUTS[0];

document.addEventListener(
  "keydown",
  (e) => {
    if (INPUTS.includes(e.key)) {
      lastInput = e.key;
    }
  },
  false
);

// tile size in px
const tileSize = 30;

const boardWidth = 15;
const boardHeight = 10;

// time in ms
const snakeUpdateTime = 150;

const defaultState = {
  // 0 is empty, -1 is food, >0 is snake piece with number indicating remaining ticks
  // (0, 0) is top left
  board: Array(boardHeight)
    .fill(null)
    .map(() => Array(boardWidth).fill(0)),
  headPosition: {
    x: 8,
    y: 5,
  },
  snakeLength: 2,
  score: 0,
  timeElapsed: 0,
  isGameOver: false,
};

function createStartState() {
  const randX = randomRange(0, boardWidth);
  const randY = randomRange(0, boardHeight);
  const newState = structuredClone(defaultState);
  newState.board[randY][randX] = -1;
  return newState;
}

let prevTimestamp = performance.now();

/**
 * Apply a function to all elements on the board and return a new board
 * @param board the old board to read from
 * @param callback (x, y, value) => newValue
 * @return new board with callback applied to all elements
 */
function mapBoard(board, callback) {
  const newBoard = structuredClone(board);
  for (let row = 0; row < boardHeight; ++row) {
    for (let col = 0; col < boardWidth; ++col) {
      newBoard[row][col] = callback(col, row, board[row][col]);
    }
  }
  return newBoard;
}

const boardOffset = { x: 100, y: 100 };

function render(state) {
  ctx.clearRect(0, 0, 9999, 9999);

  // draw frame rate counter
  ctx.fillStyle = "black";
  ctx.fillText(Math.round(fps()).toString(), 20, 40);

  // draw board
  mapBoard(state.board, (x, y, value) => {
    if (value > 0) {
      const size = ((value / state.snakeLength) * tileSize) / 2 + tileSize / 2;
      ctx.fillStyle = "rebeccapurple";
      ctx.fillRect(
        boardOffset.x + x * tileSize + (tileSize - size) / 2,
        boardOffset.y + y * tileSize + (tileSize - size) / 2,
        size,
        size
      );
    } else {
      if (value === 0) {
        ctx.fillStyle = "transparent";
      } else if (value === -1) {
        ctx.fillStyle = "red";
      }
      ctx.fillRect(
        boardOffset.x + x * tileSize,
        boardOffset.y + y * tileSize,
        tileSize,
        tileSize
      );
    }
  });

  // draw border
  ctx.strokeWidth = 2;
  ctx.strokeStyle = "black";
  ctx.strokeRect(
    boardOffset.x,
    boardOffset.y,
    boardWidth * tileSize,
    boardHeight * tileSize
  );

  // draw score
  ctx.fillStyle = "black";
  ctx.fillText(state.score, 300, 50);
}

const frameDeltas = [];
frameDeltas.max = 10;
frameDeltas.add = function (delta) {
  this.push(delta);
  if (this.length > this.max) {
    this.shift();
  }
};

function fps() {
  return (
    (1 /
      (frameDeltas.reduce((acc, val) => acc + val, 0) / frameDeltas.length)) *
    1000
  );
}

function update(state, deltaTime) {
  const newState = structuredClone(state);

  frameDeltas.add(deltaTime);

  newState.timeElapsed += deltaTime;

  // only tick over the snake when enough time has passed
  if (newState.timeElapsed > snakeUpdateTime) {
    newState.timeElapsed = 0;

    // first decrement all snake states
    newState.board = mapBoard(newState.board, (x, y, value) =>
      value > 0 ? value - 1 : value
    );


    // move the head position
    // lastInput will not change while this function is running
    switch (lastInput) {
      case "ArrowLeft":
        newState.headPosition.x =
          (newState.headPosition.x - 1 + boardWidth) % boardWidth;
        break;
      case "ArrowRight":
        newState.headPosition.x =
          (newState.headPosition.x + 1 + boardWidth) % boardWidth;
        break;
      case "ArrowUp":
        newState.headPosition.y =
          (newState.headPosition.y - 1 + boardHeight) % boardHeight;
        break;
      case "ArrowDown":
        newState.headPosition.y =
          (newState.headPosition.y + 1 + boardHeight) % boardHeight;
        break;
    }

    let foundFood = false;
    // check if the new head position has food
    if (
      newState.board[newState.headPosition.y][newState.headPosition.x] === -1
    ) {
      // increase the score
      newState.score += state.snakeLength;
      // increase the length of the snake
      ++newState.snakeLength;
      // and increase the lifespan of living tiles
      newState.board = mapBoard(newState.board, (x, y, value) =>
        value > 0 ? value + 1 : value
      );
      // and show that we should add new food
      foundFood = true;
    } else if (
      newState.board[newState.headPosition.y][newState.headPosition.x] > 0
    ) {
      // check if the new head is colliding with the body and end the game if so
      newState.isGameOver = true;
    }

    // update the board with the new head position
    newState.board[newState.headPosition.y][newState.headPosition.x] =
      state.snakeLength;

    if (foundFood) {
      // [(x,y)]
      const possibleFoodLocations = [];
      mapBoard(
        newState.board,
        (x, y, value) => value === 0 && possibleFoodLocations.push([x, y])
      );
      if (possibleFoodLocations.length === 0) {
        newState.isGameOver = true;
      }

      const newLocation = randomSelect(possibleFoodLocations);
      // update the board
      newState.board[newLocation[1]][newLocation[0]] = -1;
    }
  }
  return newState;
}

/**
 * Return a random number between [min, max)
 * @param {number} min
 * @param {number} max
 */
function randomRange(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

/**
 * Select a random element from arr
 * @param {Array} arr
 */
function randomSelect(arr) {
  return arr[randomRange(0, arr.length)];
}

let state = createStartState();

// problem with this is that it's lockstep, which means that at low framerates,
//  the game will start to behave significantly differently
function main(timestamp) {
  const deltaTime = timestamp - prevTimestamp;
  prevTimestamp = timestamp;

  state = update(state, deltaTime);
  render(state);
  if (!state.isGameOver) {
    requestAnimationFrame(main);
  }
}

requestAnimationFrame(main);
