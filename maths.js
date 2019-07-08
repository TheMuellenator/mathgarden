/*jshint esversion: 6 */

var answer;
var score = 0;
var backgroundImages = [];

function checkAnswer() {
  const prediction = predictImage();

  if (prediction === answer) {
    score++;
    if (backgroundImages.length < 6) {
      backgroundImages.push(`url('images/background${score}.svg')`);
      document.body.style.backgroundImage = backgroundImages;
      nextQuestion();
    } else {
      alert('Well done! Your maths garden is in full bloom! Want to start again?');
        restart();

    }
  } else {
    score--;
    alert('Oops! Check your calculations and try writing the number neater next time!');
    nextQuestion();
    setTimeout(function() {
      backgroundImages.pop();
      document.body.style.backgroundImage = backgroundImages;
    }, 1000);
  }
}

function nextQuestion() {
  clearCanvas();
  const n1 = Math.floor(Math.random() * 5);
  const n2 = Math.floor(Math.random() * 6);

  document.getElementById('n1').innerHTML = n1;
  document.getElementById('n2').innerHTML = n2;
  answer = n1 + n2;
}

function restart() {
  score = 0;
  backgroundImages = [];
  document.body.style.backgroundImage = backgroundImages;
  nextQuestion();
}
