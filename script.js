let imagePaths = [];
const GRID_SIZE = 4;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;

const puzzleBoard = document.getElementById("puzzle-board");
const piecesContainer = document.getElementById("pieces-container");
const referenceImage = document.getElementById("reference-image");
const message = document.getElementById("message");
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start-button");
const shuffleButton = document.getElementById("shuffle-button");
const newImageButton = document.getElementById("new-image-button");

let selectedPiece = null;
let timerInterval = null;
let startTime = null;
let gameStarted = false;
let currentImagePath = null;

// Create all the empty board slots.
function createBoard() {
    puzzleBoard.innerHTML = "";

    for (let i = 0; i < TOTAL_PIECES; i++) {
        const slot = document.createElement("div");

        slot.className = "puzzle-slot";
        slot.dataset.position = i;

        slot.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        slot.addEventListener("drop", handleDrop);

        puzzleBoard.appendChild(slot);
    }
}

// Create one rectangular piece from the campus image.
function createPiece(id) {
    const piece = document.createElement("div");

    piece.className = "puzzle-piece";
    piece.draggable = gameStarted;

    piece.dataset.pieceId = id;
    piece.style.backgroundImage = `url("${currentImagePath}")`;
    const row = Math.floor(id / GRID_SIZE);
    const column = id % GRID_SIZE;

    const x = (column / (GRID_SIZE - 1)) * 100;
    const y = (row / (GRID_SIZE - 1)) * 100;

    piece.style.backgroundPosition = `${x}% ${y}%`;

    piece.addEventListener("dragstart", (event) => {
        selectedPiece = piece;

        event.dataTransfer.setData(
            "text/plain",
            String(id)
        );

        event.dataTransfer.effectAllowed = "move";
    });

    piece.addEventListener("dragend", () => {
        selectedPiece = null;
    });

    return piece;
}


// Shuffle the pieces and place them in the pieces area.
function shufflePieces() {
    stopTimer();
    gameStarted = false;
    startButton.disabled = false;
    startButton.textContent = "Start Puzzle";
    updateTimer(0);

    const ids = Array.from(
        { length: TOTAL_PIECES },
        (_, index) => index
    );

    // Fisher-Yates shuffle.
    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    // Avoid starting with an already completed puzzle.
    if (ids.every((id, index) => id === index)) {
        [ids[0], ids[1]] = [ids[1], ids[0]];
    }

    piecesContainer.innerHTML = "";

    ids.forEach((id) => {
        piecesContainer.appendChild(createPiece(id));
    });

    message.textContent = "";
}

// Handle dropping a piece into a board slot.
function handleDrop(event) {
    event.preventDefault();

    if (!gameStarted) {
        return;
    }

    const pieceId = Number(
        event.dataTransfer.getData("text/plain")
    );

    const piece = selectedPiece;

    if (!piece || Number(piece.dataset.pieceId) !== pieceId) {
        return;
    }

    const targetSlot = event.currentTarget;

    // If the destination already contains a piece,
    // exchange the two pieces.
    const existingPiece = targetSlot.querySelector(".puzzle-piece");

    if (existingPiece) {
        const source = piece.parentElement;

        if (source === targetSlot) {
            return;
        }

        source.appendChild(existingPiece);
    }

    targetSlot.appendChild(piece);

    checkPuzzle();
}

// Check whether all pieces occupy their correct positions.
function checkPuzzle() {
    const slots = puzzleBoard.querySelectorAll(".puzzle-slot");

    const completed = Array.from(slots).every((slot, index) => {
        const piece = slot.querySelector(".puzzle-piece");

        return piece &&
            Number(piece.dataset.pieceId) === index;
    });

    if (completed) {
        const completionTime = getElapsedSeconds();
        stopTimer();
        gameStarted = false;
        puzzleBoard.querySelectorAll(".puzzle-piece").forEach((piece) => {
            piece.draggable = false;
        });
        message.textContent =
            `Congratulations! You have assembled the JNV campus in ${formatTime(completionTime)}! 🎉`;
        startButton.textContent = "Puzzle Solved";
        startButton.disabled = true;
    } else {
        message.textContent = "";
    }
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimer(totalSeconds) {
    timerDisplay.textContent = `Time: ${formatTime(totalSeconds)}`;
}

function getElapsedSeconds() {
    if (startTime === null) {
        return 0;
    }

    return Math.floor((Date.now() - startTime) / 1000);
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (startTime !== null) {
        updateTimer(getElapsedSeconds());
        startTime = null;
    }
}

function startGame() {
    if (gameStarted) {
        return;
    }

    gameStarted = true;
    startTime = Date.now();
    startButton.disabled = true;
    startButton.textContent = "Puzzle Started";

    piecesContainer.querySelectorAll(".puzzle-piece").forEach((piece) => {
        piece.draggable = true;
    });

    timerInterval = setInterval(() => {
        updateTimer(getElapsedSeconds());
    }, 250);
}

// Reset the board and timer; the player starts the timer separately.
function resetPuzzle() {
    createBoard();
    shufflePieces();
}

async function fetchImagePaths() {
    const response = await fetch("/api/images", { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Image list request failed (${response.status})`);
    }

    const filenames = await response.json();

    if (!Array.isArray(filenames) || filenames.length === 0) {
        throw new Error("The images folder contains no supported images");
    }

    return filenames.map(
        (filename) => `images/${encodeURIComponent(filename)}`
    );
}

async function chooseNewImage() {
    newImageButton.disabled = true;

    try {
        imagePaths = await fetchImagePaths();

        const otherImages = imagePaths.filter(
            (imagePath) => imagePath !== currentImagePath
        );
        const imagesToChooseFrom = otherImages.length > 0
            ? otherImages
            : imagePaths;
        const randomIndex = Math.floor(
            Math.random() * imagesToChooseFrom.length
        );

        currentImagePath = imagesToChooseFrom[randomIndex];
        referenceImage.src = currentImagePath;
        resetPuzzle();
    } catch (error) {
        console.error("Could not refresh images from the images folder.", error);
        message.textContent =
            "Could not refresh images. Check that the local server is running.";
    } finally {
        newImageButton.disabled = false;
    }
}

async function initialiseGame() {
    try {
        imagePaths = await fetchImagePaths();

        currentImagePath = imagePaths.find(
            (imagePath) => imagePath.endsWith("/JNV_gate.png")
        ) || imagePaths[0];
        referenceImage.src = currentImagePath;
        startButton.disabled = false;
        shuffleButton.disabled = false;
        newImageButton.disabled = false;
        resetPuzzle();
    } catch (error) {
        console.error("Could not load images from the images folder.", error);
        message.textContent =
            "Could not load images. Start the app with `python server.py` and open http://127.0.0.1:8000.";
    }
}

startButton.addEventListener("click", startGame);
shuffleButton.addEventListener("click", resetPuzzle);
newImageButton.addEventListener("click", chooseNewImage);

initialiseGame();
