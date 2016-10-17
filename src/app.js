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
