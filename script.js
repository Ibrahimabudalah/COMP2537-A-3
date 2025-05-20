const board = document.getElementById("gameBoard");
const message = document.getElementById("message");
const clicksDisplay = document.getElementById("clicks");
const matchedDisplay = document.getElementById("matched");
const leftDisplay = document.getElementById("left");
const totalDisplay = document.getElementById("total");
const timerDisplay = document.getElementById("timer");
const difficultySelect = document.getElementById("difficulty");

let cards = [], firstCard = null, secondCard = null;
let lockBoard = false, clicks = 0, matches = 0, totalPairs = 0;
let timer, timeLeft = 60;

const DIFFICULTY_SETTINGS = {
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 90 },
  hard: { pairs: 10, time: 120 },
};

async function getRandomPokemonPairs(count) {
  const ids = new Set();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * 1025) + 1);
  }
  const promises = [...ids].map(id =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(res => res.json())
  );
  const results = await Promise.all(promises);
  return results
    .map(p => ({
      name: p.name,
      img: p.sprites?.other?.["official-artwork"]?.front_default || ""
    }))
    .filter(p => p.img);
}

function createCard(pokemon) {
  const card = document.createElement("div");
  card.classList.add("card", "w-full", "h-[150px]", "md:h-[200px]");
  card.innerHTML = `
    <div class="inner-card w-full h-full">
      <div class="back">
        <img src="back.webp" alt="pokeball" class="w-4/5 h-4/5 object-contain" />
      </div>
      <div class="front">
        <img src="${pokemon.img}" alt="${pokemon.name}" class="w-full h-full object-contain rounded-lg" />
      </div>
    </div>
  `;
  card.dataset.name = pokemon.name;
  card.addEventListener("click", handleCardClick);
  return card;
}

async function startGame() {
  board.innerHTML = "";
  message.textContent = "";
  cards.forEach(card => card.classList.remove("flipped", "matched"));
  cards = [];
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  clicks = 0;
  matches = 0;

  const difficulty = difficultySelect.value;
  const settings = DIFFICULTY_SETTINGS[difficulty];
  totalPairs = settings.pairs;
  timeLeft = settings.time;

  const pokemon = await getRandomPokemonPairs(totalPairs);
  const allCards = [...pokemon, ...pokemon].sort(() => 0.5 - Math.random());

  allCards.forEach(p => {
    const card = createCard(p);
    cards.push(card);
    board.appendChild(card);
  });

  updateStatus();
  startTimer();
}

function handleCardClick(e) {
  if (lockBoard) return;
  const card = e.currentTarget;
  if (card === firstCard || card.classList.contains("matched")) return;

  card.classList.add("flipped");
  clicks++;

  if (!firstCard) {
    firstCard = card;
  } else {
    secondCard = card;
    checkMatch();
  }

  updateStatus();
}

function checkMatch() {
  const isMatch = firstCard.dataset.name === secondCard.dataset.name;
  if (isMatch) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matches++;
    resetFlips();
    if (matches === totalPairs) endGame(true);
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetFlips();
    }, 1000);
  }
}

function resetFlips() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function updateStatus() {
  clicksDisplay.textContent = clicks;
  matchedDisplay.textContent = matches;
  leftDisplay.textContent = totalPairs - matches;
  totalDisplay.textContent = totalPairs;
  timerDisplay.textContent = timeLeft;
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function endGame(won) {
  clearInterval(timer);
  message.textContent = won ? "You win!" : "Game Over";
  lockBoard = true;
}

function resetGame() {
  clearInterval(timer);
  startGame();
}

document.getElementById("start").addEventListener("click", startGame);
document.getElementById("reset").addEventListener("click", resetGame);
document.getElementById("powerUp").addEventListener("click", () => {
  cards.forEach(c => {
    if (!c.classList.contains("matched")) c.classList.add("flipped");
  });
  setTimeout(() => {
    cards.forEach(c => {
      if (!c.classList.contains("matched")) c.classList.remove("flipped");
    });
  }, 1500);
});
