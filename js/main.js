/***
 * Defines a rectangular object that can be rendered on the screen
 */
class Sprite {
  /**
   *
   * @param {number} x the x position of the top left corner
   * @param {number} y the y position of the top left corner
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /***
   * Render the sprite at its position on the screen
   */
  draw() {}

}

/***
 * Defines a rectangular clickable sprite that does something when clicked
 */
class Clickable extends Sprite {
//we might want to make this a subclass of sprite and just display sprites
  /**
   *
   * @param {number} x the x position of the top left corner
   * @param {number} y the y position of the top left corner
   * @param {number} width the width of the zone
   * @param {number} height the height of the zone
   */
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
  }

  left_click() {}

  right_click() {}

  test_click(x, y, button) {
    if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
      if (button === 0) {
        this.left_click();
      } else if (button === 2) {
        this.right_click()
      }
      return true;
    }
    return false;
  }

}

class SnakeTile extends Sprite {
  constructor(x, y, width, height, trueX, trueY) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.trueX = trueX;
    this.trueY = trueY;
  }

  draw() {
    ctx.fillStyle = "#888888";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    if (snake_board.grid[this.trueX][this.trueY] === -1) {
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else if (snake_board.grid[this.trueX][this.trueY] > 0){
      ctx.fillStyle = "#888888";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "#ff0000";
      let scale_factor = (snake_board.grid[this.trueX][this.trueY]/snake_board.length)/4;
      ctx.fillRect(this.x + this.width*scale_factor, this.y + this.height*scale_factor, this.width - 2*this.width*scale_factor, this.height - 2*this.height*scale_factor);
    }

  }
}


class Button extends Clickable{
  /**
   * Creates a button which runs a function when it is clicked
   * @param x
   * @param y
   * @param width
   * @param height
   * @param {string} text The text on the button
   * @param {function} action The function the button runs on press
   */
  constructor(x, y, width, height, text, action) {
    super(x, y, width, height);
    this.text = text;
    this.action = action;
    this.font = height + "px Verdana"
  }

  left_click() {
    this.action();
  }

  draw() {
    ctx.fillStyle = "#000099";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.fillText(this.text, this.x + this.width/2, this.y + this.height*.9, this.width);
  }

}

class Timer extends Sprite {
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.font = height + "px Consolas";
  }

  draw() {
    ctx.fillStyle = "#333333";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#999999";
    ctx.textAlign = "center";
    ctx.font = this.font;
    ctx.fillText(Math.floor(play_time/60) + ":" + (play_time%60 < 10 ? "0": "") + play_time%60 , this.x + this.width/2, this.y + this.height*.9);
  }
}

class Popup extends Clickable {
  constructor(title_text) {
    //the popup covers the entire screen
    super(0, 0, canvas.width, canvas.height);
    this.title_text = title_text;
  }

  draw() {
    ctx.fillStyle = "#dfafaf";
    ctx.fillRect(this.width*.33, this.height*.15, this.width*.33, this.height*.30);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.width*.33, this.height*.15, this.width*.33, this.height*.30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "40px Verdana";
    ctx.textAlign = "center";
    ctx.fillText(this.title_text, this.width/2, this.height*.23, this.width*.33);
  }


}

//don't ask me why the signs are reversed
const DIRECTIONS = {
  NORTH: {x: 0, y: 1},
  EAST: {x: 1, y: 0},
  SOUTH: {x: 0, y: -1},
  WEST: {x: -1, y: 0}
};
Object.freeze(DIRECTIONS);
const START_SIZE = 5;
const GAIN_FROM_FOOD = 3;

/**
 * Represents a snake board. 0 means empty, >0 means snake, -1 means food
 * The number on the snake will represent the number of turns that that tile has been alive
 * if that number exceeds the length, then the tile is set to 0
 */
class SnakeBoard {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.direction = DIRECTIONS.EAST;
    this.length = START_SIZE;
    this.grid = new Array(this.width);
    for (let i = 0; i < this.width; i++) {
      this.grid[i] = new Array(this.height).fill(0)
    }
    this.grid[Math.floor(this.width/2)][Math.floor(this.height/2)] = 1;
    this.add_food();

  }

  add_food() {
    //get coords of snake and the tiles
    let randX = randRange(0, this.width);
    let randY = randRange(0, this.height);
    //get random values while the tiles are not empty
    while (this.grid[randX][randY] !== 0) {
      randX = randRange(0, this.width);
      randY = randRange(0, this.height);
    }
    this.grid[randX][randY] = -1;
  }

  step_turn() {
    //updates all the tiles by 1 turn passed
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (this.grid[i][j] > 0) {
          this.grid[i][j] = (this.grid[i][j] + 1) % this.length;
        }
      }
    }

    let nextX = 0;
    let nextY = 0;
    //next find the most recent tile and go in that direction
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        if (this.grid[i][j] === 2) {
          nextX = i + this.direction.x;
          nextY = j + this.direction.y;
        }
      }
    }
    //next check if the direction is valid and the tile is empty(no snake body)
    if (nextX >= this.width || nextX < 0 || nextY >= this.height || nextY < 0 || this.grid[nextX][nextY] > 0) {
      end_game(false);
      return;
    }
    //account for possible food
    if (this.grid[nextX][nextY] === -1) {
      this.length += GAIN_FROM_FOOD;
      this.add_food();
    }

    //finally add the next tile
    this.grid[nextX][nextY] = 1;

  }

  check_win() {
    if (this.length > this.width*this.height) end_game(true);
  }
}


/**
 * Return a random int between min(inclusive) and max(exclusive)
 * @param min
 * @param max
 */
function randRange(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}


function get_mouse_pos(event) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((event.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
    y: Math.round((event.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
  };
}

function reverse(arr) {
  let new_arr = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    new_arr[i] = arr[arr.length - 1 - i];
  }
  return new_arr;
}

function on_mouse_down(event) {
  let pos = get_mouse_pos(event);
  for(const sprite of reverse(sprites)) {
    //ensures that only the top sprites get clicked
    if (sprite instanceof Clickable) {
      if (sprite.test_click(pos.x, pos.y, event.button)) {
        //needs to be unreversed
        return
      }
    }
  }
}
function draw() {
//sprites on the top are drawn last
//sprites added most recently are at the end of the list
  for(const sprite of sprites) {
    sprite.draw();
  }
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function render() {
  clear();
  draw();
}

function end_game(win) {
  clearInterval(game_timer);
  if (win) {
    let popup =  new Popup("You win!");
    sprites.push(popup);

  } else {
    let popup = new Popup("You lose!");
    sprites.push(popup);
  }
  sprites.push(new Button(canvas.width*.45, canvas.height*.25, canvas.width*.1, canvas.height*.1, "Play Again", () => init_game(50, 30)));
  clearInterval(snake_mover)
}

function update() {
  snake_board.check_win();
  render();
}

function get_random_color() {
  let letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function move_snake() {
  snake_board.step_turn();
}

function init_game(width, height) {
  snake_board = new SnakeBoard(width, height);
  sprites = [];
  //-50 accounts for the space the title plage takes up
  let tile_size = Math.min(canvas.width/width, (canvas.height)/height);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      sprites.push(new SnakeTile(tile_size*i, tile_size*j, tile_size, tile_size, i, j));
    }
  }
  snake_mover = setInterval(move_snake, 200);
  //play_time = 0;
  //game_timer = setInterval(() => play_time++, 1000);
  //sprites.push(new Timer(0, 0, 150, 50));
  //sprites.push(new Button(150, 0, 150, 50, "New Game", () => {end_game(false);}))
}


//disables the context menu when you left click on the canvas
$('body').on('contextmenu', '#canvas', function(e){ return false; });
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


let frame_count = 0;

let sprites = [];

/**
 *
 * @type {SnakeBoard}
 */
let snake_board = [];
let minefield = [];
let play_time = 0;
let game_timer = 0;
let snake_mover = 0;
// for (let i = 0; i < 10; i++) {
//   for (let j = 0; j < 10; j++) {
//     sprites.push(new DisplayTimesClicked(30*i, 30*j, 30, 30, get_random_color()))
//   }
// }
// sprites.push(new DisplayTimesClicked(50, 50, 50, 50, "#363cff"));
//canvas.addEventListener("mousemove", this.detect_mouse, false);
canvas.addEventListener("mousedown", on_mouse_down, false);
document.onkeydown = function(e) {
  switch (e.key) {
    case "ArrowDown":
      if (snake_board.direction !== DIRECTIONS.SOUTH) {
        snake_board.direction = DIRECTIONS.NORTH;
      }
      break;
    case "ArrowLeft":
      if (snake_board.direction !== DIRECTIONS.EAST) {
        snake_board.direction = DIRECTIONS.WEST;
      }
      break;
    //  why down and up have to be reversed if beyond me
    case "ArrowUp":
      if (snake_board.direction !== DIRECTIONS.NORTH) {
        snake_board.direction = DIRECTIONS.SOUTH;
      }
      break;
    case "ArrowRight":
      if (snake_board.direction !== DIRECTIONS.WEST) {
        snake_board.direction = DIRECTIONS.EAST;
      }
      break;
  }
};
setInterval(update, 100);

init_game(50, 30);
