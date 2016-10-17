(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const Astroid = require('./astroid.js');
const Lazer = require('./lazer.js');
const Vector = require('./vector');
/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);
var listOfAsterods = [];

var lazer;
var hasFired = false;
var lives = 3;
var score = 0;
var level = 1;
var maxAsteroids = 10;
console.log(maxAsteroids);
for(var i = 0 ; i < maxAsteroids; i++)
{
  var mass = Math.floor(Math.random() * 100 + 50);
  var ang = Math.floor(Math.random() * 100 + 1);
  console.log("We made it");
  listOfAsterods.push(new Astroid({x: 100  * i, y:100 * i}, canvas, mass, ang));
}

listOfAsterods.forEach(function(astroid){
  astroid.setAngularVelocity();
});

listOfAsterods.sort(function(a,b){return a.position.x - b.position.x});

var firedLazer = new Audio('assets/firedLazer.wav');
var explosion = new Audio('assets/Explosion.wav');
var asteroidCollsion = new Audio('assets/asteroidCollision.wav');
/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  player.update(elapsedTime, canvas);
  listOfAsterods.forEach(function(asteroid){asteroid.update(elapsedTime);});
  if(player.fired)
  {
    lazer = new Lazer({x: player.position.x , y: player.position.y}, canvas, {x: player.velocity.x, y: player.velocity.y}, player.angle);
    firedLazer.play();
    hasFired = true
  }
  if(hasFired == true)
  {
    lazer.update(elapsedTime);
  }
  // TODO: Update the game objects
  // now that all our asteroids  have moved.
  listOfAsterods.sort(function(a,b){return a.position.x - b.position.x});

  // The active list will hold all balls
  // we are currently considering for collisions
  var active = [];

  // The potentially colliding list will hold
  // all pairs of balls that overlap in the x-axis,
  // and therefore potentially collide
  var potentiallyColliding = [];

  // For each ball in the axis list, we consider it
  // in order
  listOfAsterods.forEach(function(astroid, aindex){
    // remove balls from the active list that are
    // too far away from our current ball to collide
    // The Array.prototype.filter() method will return
    // an array containing only elements for which the
    // provided function's return value was true -
    // in this case, all balls that are closer than 30
    // units to our current ball on the x-axis
    active = active.filter(function(newAstroid){
      return astroid.position.x - newAstroid.position.x  < 30;
    });
    // Since only balls within colliding distance of
    // our current ball are left in the active list,
    // we pair them with the current ball and add
    // them to the potentiallyColliding array.
    active.forEach(function(newAstroid, bindex){
      potentiallyColliding.push({a: newAstroid, b: astroid});
    });
    // Finally, we add our current ball to the active
    // array to consider it in the next pass down the
    // axisList
    active.push(astroid);
});

// At this point we have a potentaillyColliding array
  // containing all pairs overlapping in the x-axis.  Now
  // we want to check for REAL collisions between these pairs.
  // We'll store those in our collisions array.
  var collisions = [];
  potentiallyColliding.forEach(function(pair){
    // Calculate the distance between balls; we'll keep
    // this as the squared distance, as we just need to
    // compare it to a distance equal to the radius of
    // both balls summed.  Squaring this second value
    // is less computationally expensive than taking
    // the square root to get the actual distance.
    // In fact, we can cheat a bit more and use a constant
    // for the sum of radii, as we know the radius of our
    // balls won't change.
    var distSquared =
      Math.pow(pair.a.position.x - pair.b.position.x, 2) +
      Math.pow(pair.a.position.y - pair.b.position.y, 2);
    // (15 + 15)^2 = 900 -> sum of two balls' raidius squared
    if(distSquared < 4096) {
      // Color the collision pair for visual debugging
      pair.a.color = 'red';
      pair.b.color = 'green';
      // Push the colliding pair into our collisions array
      collisions.push(pair);
    }
  });

  // TODO: Process ball collisions
  collisions.forEach(function(pair){
    var collisionNormal = {
      x: pair.a.position.x - pair.b.position.x,
      y: pair.a.position.y - pair.b.position.y
    }

    var overlap = 69 - Vector.magnitude(collisionNormal);
    var collisionNormal = Vector.normalize(collisionNormal);
    pair.a.position.x += collisionNormal.x * overlap / 2;
    pair.a.position.y += collisionNormal.y * overlap / 2;
    pair.b.position.x -= collisionNormal.x * overlap / 2;
    pair.b.position.y -= collisionNormal.y * overlap / 2;

    var angle = Math.atan2(collisionNormal.y, collisionNormal.x);
    var a = Vector.rotate(pair.a.velocity, angle);
    var b = Vector.rotate(pair.b.velocity, angle);

    var temp = a.x;
    a.x = b.x;
    b.x = temp;

    a = Vector.rotate(a, -angle);
    b = Vector.rotate(b, -angle);

    pair.a.velocity.x = a.x;
    pair.a.velocity.y = a.y;
    pair.b.velocity.x = b.x;
    pair.b.velocity.y = b.y;

    //asteroidCollsion.play()
});
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillText("Score:" + score, canvas.width - 80, 10);
  ctx.fillText("Level:" + level, 10, 10);
  ctx.fillText("Lives:" + lives, canvas.width / 2, 10);
  player.render(elapsedTime, ctx);
  listOfAsterods.forEach(function(asteroid){asteroid.render(elapsedTime, ctx);});
  if(hasFired == true)
  {
    lazer.render(elapsedTime,ctx);
  }
}

},{"./astroid.js":2,"./game.js":3,"./lazer.js":4,"./player.js":5,"./vector":6}],2:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Astroid;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Astroid(position, canvas, mass, angle) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.spritesheet  = new Image();
  this.spritesheet.src = encodeURI('assets/big_astroid.png');
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: 0,
    y: 0
  }
  this.angle = angle;
  this.radius  = 32;
  this.height = 64;
  this.width = 64;
  this.broken = false;
  this.mass = mass;
}

Astroid.prototype.setAngularVelocity = function()
{
  this.angle = Math.floor(Math.random() * 360 + 1);
  var acceleration = {
    x: Math.sin(this.angle),
    y: Math.cos(this.angle)
  }
  this.velocity.x -= acceleration.x * 1;
  this.velocity.y -= acceleration.y * 1;
}

/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Astroid.prototype.update = function(time) {
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
  // Wrap around the screen
  if(this.position.x < 0) this.position.x += this.worldWidth;
  if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
  if(this.position.y < 0) this.position.y += this.worldHeight;
  if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Astroid.prototype.render = function(time, ctx) {
  ctx.drawImage(
        // image
        this.spritesheet,
        // source rectangle
        0, 0, this.width, this.height,
        // destination rectangle
        this.position.x, this.position.y, this.width, this.height
      );
  }

},{}],3:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],4:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Lazer;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Lazer(position, canvas, velocity, angle) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.spritesheet  = new Image();
  this.spritesheet.src = encodeURI('assets/lazer.png');
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: velocity.x,
    y: velocity.y
  }
  this.angle = angle;
  this.height = 30;
  this.width = 30;
}
/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Lazer.prototype.update = function(time) {

  var acceleration = {
    x: Math.sin(this.angle),
    y: Math.cos(this.angle)
  }
  this.velocity.x -= acceleration.x;
  this.velocity.y -= acceleration.y;
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Lazer.prototype.render = function(time, ctx) {
  //ctx.save();
  //ctx.translate(this.position.x, this.position.y);
  //ctx.rotate(-this.angle);
  ctx.drawImage(
        // image
        this.spritesheet,
        // source rectangle
        0, 0, this.width, this.height,
        // destination rectangle
        this.position.x, this.position.y, this.width, this.height
      );
  //ctx.restore();
  }

},{}],5:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Player(position, canvas) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.state = "idle";
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: 0,
    y: 0
  }
  this.angle = 0;
  this.radius  = 64;
  this.thrusting = false;
  this.steerLeft = false;
  this.steerRight = false;
  this.fired = false;

  var self = this;
  window.onkeydown = function(event) {
    console.log(event.key);
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = true;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = true;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = true;
        break;
     case 'f':
        self.fired = true;
        break;
    case 't':
        self.teleport = true;
        break;
    }
  }

  window.onkeyup = function(event) {
    switch(event.key) {
      case 'ArrowUp': // up
      case 'w':
        self.thrusting = false;
        break;
      case 'ArrowLeft': // left
      case 'a':
        self.steerLeft = false;
        break;
      case 'ArrowRight': // right
      case 'd':
        self.steerRight = false;
        break;
    case 'f':
        self.fired = false;
        break;
    case 't':
        self.teleport = true;
        break;
    }
  }
}



/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Player.prototype.update = function(time, canvas) {

  if(this.teleport)
  {
    var newX = Math.floor(Math.random() * canvas.width + 1);
    var newY = Math.floor(Math.random() * canvas.height + 1);
    this.position = {x:newX, y:newY};
    this.teleport = false;
  }
  // Apply angular velocity
  if(this.steerLeft) {
    this.angle += 0.1;
  }
  if(this.steerRight) {
    this.angle -= 0.1;
  }
  // Apply acceleration
  if(this.thrusting) {
    var acceleration = {
      x: Math.sin(this.angle),
      y: Math.cos(this.angle)
    }
    this.velocity.x -= acceleration.x;
    this.velocity.y -= acceleration.y;
  }
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
  // Wrap around the screen
  if(this.position.x < 0) this.position.x += this.worldWidth;
  if(this.position.x > this.worldWidth) this.position.x -= this.worldWidth;
  if(this.position.y < 0) this.position.y += this.worldHeight;
  if(this.position.y > this.worldHeight) this.position.y -= this.worldHeight;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Player.prototype.render = function(time, ctx) {
  ctx.save();

  // Draw player's ship
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(-this.angle);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-10, 10);
  ctx.lineTo(0, 0);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();

  // Draw engine thrust
  if(this.thrusting) {
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(5, 10);
    ctx.arc(0, 10, 5, 0, Math.PI, true);
    ctx.closePath();
    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
  ctx.restore();
}

},{}],6:[function(require,module,exports){
module.exports = exports = {
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


function rotate(a, angle)
{
  return{
        x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
        y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
        }
}


function dotProduct(a,b)
{
  return a.x * b.x + a.y * b.y
}

function magnitude(a)
{
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

function normalize(a)
{
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
