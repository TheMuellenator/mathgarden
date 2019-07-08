/*jshint esversion: 6 */

// Styling Info
const CANVAS_WIDTH = 150;
const CANVAS_HEIGHT = 150;
const LINE_WIDTH = 15;                    // bad prediction if too thin
const LINE_COLOUR = "#FFFFFF";            // white
const BACKGROUND_COLOUR = "#000000";      // black for best prediction

// For Tracking Mouse Cooridates
var currentX = 0;
var currentY = 0;
var previousX = 0;
var previousY = 0;

var isPainting; // boolean for when to record drawing coordinates
var canvas;
var context;

function prepareCanvas() {
    // console.log("Preparing Canvas: Config Mouse Actions");

    // Styling Canvas
    canvas = document.getElementById('my-canvas');
    context = canvas.getContext("2d");
    context.fillStyle = BACKGROUND_COLOUR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // (xPos, yPos, width, height)

    // Line Style
    context.strokeStyle = LINE_COLOUR;
    context.lineJoin = "round"; // get nice round edges
    context.lineWidth = LINE_WIDTH;

    // Mouse events and drawing
    document.addEventListener('mousedown', function (e) {

        isPainting = true;

        currentX = e.clientX - canvas.offsetLeft;
        currentY = e.clientY - canvas.offsetTop;
        // Show students coordinates in console.
        // console.log('Mouse Down. mouse X: ' + currentX + ' mouse Y: ' + currentY);
        previousX = currentX;
        previousY = currentY;
        draw();
    });

      document.addEventListener('mousemove', function (e) {
        if (isPainting) {
            previousX = currentX;
            previousY = currentY;
            currentX = e.clientX - canvas.offsetLeft;
            currentY = e.clientY - canvas.offsetTop;
            draw();
        }
    });

    // Stop recording if mouse button released
      document.addEventListener('mouseup', function (e) {
        isPainting = false;
    });

    // Stop if no longer drawing on canvas
      document.addEventListener('mouseleave', function (e) {
        isPainting = false;
    });
    
    
    // Touch events for mobile web
    document.addEventListener("touchstart", function (e) {
        isPainting = true;
        currentX = e.touches[0].clientX - canvas.offsetLeft;
        currentY = e.touches[0].clientY - canvas.offsetTop;
        previousX = currentX;
        previousY = currentY;
        draw();
    });

    document.addEventListener("touchend", function (e) {
        isPainting = false;
    });

    // finger moves into browser
    document.addEventListener("touchcancel", function (e) {
        isPainting = false;
    });

    document.addEventListener("touchmove", function (e) {
        if (isPainting) {
            e.preventDefault(); // stop scrolling
            previousX = currentX;
            previousY = currentY;
            currentX = e.touches[0].clientX - canvas.offsetLeft;
            currentY = e.touches[0].clientY - canvas.offsetTop;
            draw();
        }
    });
    
}

// updates the canvas
function draw() {
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(currentX, currentY);
    context.closePath();
    context.stroke();
}

function clearCanvas() {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = BACKGROUND_COLOUR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    currentX = 0;
    currentY = 0;
    previousX = 0;
    previousY = 0;
}
