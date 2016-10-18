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
var ListsOfLazers = []
var hasFired = false;
var lives = 3;
var score = 0;
var level = 1;
var maxAsteroids = 10;
var count = 0;
console.log(maxAsteroids);
for(var i = 0 ; i < maxAsteroids; i++)
{
  var mass = Math.floor(Math.random() * 100 + 50);
  var ang = Math.floor(Math.random() * 100 + 1);
  console.log("We made it");
  listOfAsterods.push(new Astroid({x: 100  * i, y:100 * i}, canvas, mass, ang, 64, 64,'assets/big_astroid.png'));
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
function update(elapsedTime)
{
  player.update(elapsedTime);
  // TODO: Update the game objects
  listOfAsterods.sort(function(a,b){return a.position.x - b.position.x});
  console.log(player.fired);
  if(player.fired)
  {
    console.log("Should fire.")
    hasFired = true;
  }
  if(hasFired == true && player.state != "dead")
   {
     console.log("We have fired")
        ListsOfLazers.push(new Lazer(
          {
            x:player.position.x,
            y:player.position.y
          },
          canvas, player.velocity, player.angle
        ));
        firedLazer.play();
        hasFired = false;
  }
  //check for asteroid collisions
  asteroidCollission();
  if(player.state != "dead") {
    playerCollision();
  }
  lazerCollsion();
  listOfAsterods.forEach(function(asteroid){asteroid.update();});
  ListsOfLazers.forEach(function(lazer){lazer.update();});
}

function asteroidCollission ()
{
  var active = [];
  var potentiallyColliding = [];

  // For each ball in the axis list, we consider it
  // in order
  listOfAsterods.forEach(function(astroid, aindex){
    active = active.filter(function(newAstroid){
      return astroid.position.x - newAstroid.position.x  < (astroid.radius + newAstroid.raduis);
    });

    active.forEach(function(newAstroid, bindex){
      potentiallyColliding.push({a: newAstroid, b: astroid});
    });
    active.push(astroid);
});

  var collisions = [];
  potentiallyColliding.forEach(function(pair){
    var distSquared =
      Math.pow(pair.a.position.x - pair.b.position.x, 2) +
      Math.pow(pair.a.position.y - pair.b.position.y, 2);
    // (15 + 15)^2 = 900 -> sum of two balls' raidius squared
    var sumRadiusSqueared = (pair.a.radius + pair.b.raidus) * (pair.a.radius + pair.b.raidus);
    console.log(sumRadiusSqueared);
    if(distSquared < sumRadiusSqueared) {
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
    var totalRadius = pair.a.radius + pair.b.radius;
    var overlap = totalRadius + 6 - Vector.magnitude(collisionNormal);
    var collisionNormal = Vector.normalize(collisionNormal);
    pair.a.position.x += collisionNormal.x * overlap / 2;
    pair.a.position.y += collisionNormal.y * overlap / 2;
    pair.b.position.x -= collisionNormal.x * overlap / 2;
    pair.b.position.y -= collisionNormal.y * overlap / 2;

    var angle = Math.atan2(collisionNormal.y, collisionNormal.x);
    var a = Vector.rotate(pair.a.velocity, angle);
    var b = Vector.rotate(pair.b.velocity, angle);

    //V1 = U1(m1-m2)/(m1 + m2) + U2 (2m2)/m1 + m2
    //v2 = U2(m2-m1)/(m2 + m1) + U1 (2m1)/m2 + m1
    var aPrevious = a.x;
    var bPrevious = b.x;

    a.x = (aPrevious * (pair.a.mass - pair.b.mass) + 2 * pair.b.mass * bPrevious)/(pair.a.mass + pair.b.mass);
    b.x = (bPrevious * (pair.b.mass - pair.a.mass) + 2 * pair.a.mass * aPrevious)/(pair.a.mass + pair.b.mass);

    a = Vector.rotate(a, -angle);
    b = Vector.rotate(b, -angle);

    pair.a.velocity.x = a.x;
    pair.a.velocity.y = a.y;
    pair.b.velocity.x = b.x;
    pair.b.velocity.y = b.y;

    asteroidCollision.play()
  });
}

//check to see if player hit an asteroid
function playerCollision()
{
  for(var i=0; i < listOfAsterods.length; i++)
  {
    var distSquared =
    Math.pow(player.position.x - listOfAsterods[i].position.x, 2) +
    Math.pow(player.position.y - listOfAsterods[i].position.y, 2);
    if(distSquared < Math.pow(10+listOfAsterods[i].radius, 2))
    {
      player.state = "dead";
      explosion.play();
    }
  }
}

function lazerCollsion(){
  for(var i = 0; i < listOfAsterods.length; i++){
    for(var j = 0; j < ListsOfLazers.length; j++){
      var distSquared =
        Math.pow((ListsOfLazers[j].position.x) - (listOfAsterods[i].position.x + listOfAsterods[i].radius), 2) +
        Math.pow((ListsOfLazers[j].position.y) - (listOfAsterods[i].position.y + listOfAsterods[i].radius), 2);

      if(distSquared < Math.pow(listOfAsterods[i].radius, 2))
      {
        // Laser struck asteroid
        if(listOfAsterods[i].width > 5){
          var angle = Math.atan(listOfAsterods[i].velocity.y/listOfAsterods[i].velocity.x);
          var velocity1 = {x: Math.cos(angle + Math.PI/4)*1.5, y: Math.sin(angle + Math.PI/4)*1.5};
          var velocity2 = {x: Math.cos(angle - Math.PI/4)*1.5, y: Math.sin(angle - Math.PI/4)*1.5};

          var asteroid1 = new Astroid(
            {
              x:listOfAsterods[i].x,
              y:listOfAsterods[i].y
            },
            canvas, 32, 32, 'assets/broken_asteriod.png'
          );
          asteroid1.setVelocity(velocity1);
          asteroid1.mass = listOfAsterods[i].mass/2;
          listOfAsterods.push(asteroid1);

          var asteroid2 =  new Astroid(
            {
              x:listOfAsterods[i].x,
              y:listOfAsterods[i].y
            },
            canvas, 32, 32, 'assets/broken_asteriod.png'
          );
          asteroid2.setVelocity(velocity2);
          asteroid2.mass = listOfAsterods[i].mass/2;
          listOfAsterods.push(asteroid2);
        }
        console.log(listOfAsterods.length);
        if(listOfAsterods.length == 1)
        {
          listOfAsterods.splice(i,1);
          level++;
          for(i=0; i < 12; i++)
           {
              var newMass = Math.floor(Math.random() * 100 + 50);
              var newAng = Math.floor(Math.random() * 100 + 1);
             listOfAsterods.push(new Asteroid(
               {
                   x:Math.floor(Math.random() * canvas.width),
                   y:Math.floor(Math.random() * canvas.height)
              },
                 canvas,newMass, newAng, 65,65, 'assets/big_astroid.png'
            ));
        }
      }
      else
      {
        asteroids.splice(i,1);
      }
      score += 10;
      break;
      }
    }
  }
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
  player.render(elapsedTime, ctx);
  listOfAsterods.forEach(function(asteroid){asteroid.render(elapsedTime, ctx);});
  if(ListsOfLazers != undefined)
  {
    ListsOfLazers.forEach(function(lazer){lazer.render(elapsedTime, ctx);});
  }

  if(player.state == "dead")
   {
    if(count == 0)
     {
      time = elapsedTime;
      count++;
      lives--;
    }
    else
    {
      time+= elapsedTime;
      if(time > 1000)
      {
        time = 0;
        count = 0;
        player.state = "idle";
      }
    }
  }
  ctx.fillStyle = "white";
  ctx.fillText("Score:" + score, canvas.width - 80, 10);
  ctx.fillText("Level:" + level, 10, 10);
  ctx.fillText("Lives:" + lives, canvas.width / 2, 10);
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
function Astroid(position, canvas, mass, angle, width, height, image) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.spritesheet  = new Image();
  this.spritesheet.src = encodeURI(image);
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: 0,
    y: 0
  }
  this.angle = angle;
  this.radius  = width / 2;
  this.height = height;
  this.width = width;
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

Astroid.prototype.setVelocity = function(v)
{
  this.velocity.x = v.x;
  this.velocity.y = v.y
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
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(-this.angle);
  ctx.drawImage(
        // image
        this.spritesheet,
        // source rectangle
        0, 0, this.width, this.height,
        // destination rectangle
        this.width / 2, this.height/2, this.width/2, this.height/2
      );
  ctx.restore();
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
