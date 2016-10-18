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
