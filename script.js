let imagePaths = [];
const GITHUB_IMAGES_API =
    "https://api.github.com/repos/sharepickiran-gif/JNV_puzzle/contents/images";
const SUPPORTED_IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|bmp)$/i;
const GRID_SIZE = 4;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;
const GAME_DURATION_SECONDS = 60;

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
let deadline = null;
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
    updateTimer(GAME_DURATION_SECONDS);

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

    if (getRemainingSeconds() <= 0) {
        failGame();
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
        const remainingSeconds = getRemainingSeconds();
        stopTimer();
        gameStarted = false;
        puzzleBoard.querySelectorAll(".puzzle-piece").forEach((piece) => {
            piece.draggable = false;
        });
        piecesContainer.querySelectorAll(".puzzle-piece").forEach((piece) => {
            piece.draggable = false;
        });
        message.textContent =
            `Congratulations! You solved the puzzle with ${formatTime(remainingSeconds)} remaining! 🎉`;
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
    timerDisplay.textContent = `Time remaining: ${formatTime(totalSeconds)}`;
}

function getRemainingSeconds() {
    if (deadline === null) {
        return GAME_DURATION_SECONDS;
    }

    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    deadline = null;
}

function failGame() {
    stopTimer();
    gameStarted = false;
    updateTimer(0);
    puzzleBoard.querySelectorAll(".puzzle-piece").forEach((piece) => {
        piece.draggable = false;
    });
    piecesContainer.querySelectorAll(".puzzle-piece").forEach((piece) => {
        piece.draggable = false;
    });
    message.textContent =
        "Time's up! You were unable to complete the puzzle. Shuffle the pieces to try again.";
    startButton.textContent = "Time's Up";
    startButton.disabled = true;
}

function startGame() {
    if (gameStarted) {
        return;
    }

    gameStarted = true;
    deadline = Date.now() + GAME_DURATION_SECONDS * 1000;
    startButton.disabled = true;
    startButton.textContent = "Puzzle Started";
    updateTimer(GAME_DURATION_SECONDS);

    piecesContainer.querySelectorAll(".puzzle-piece").forEach((piece) => {
        piece.draggable = true;
    });

    timerInterval = setInterval(() => {
        const remainingSeconds = getRemainingSeconds();
        updateTimer(remainingSeconds);

        if (remainingSeconds === 0) {
            failGame();
        }
    }, 250);
}

// Reset the board and timer; the player starts the timer separately.
function resetPuzzle() {
    createBoard();
    shufflePieces();
}

async function fetchImagePaths() {
    const isGitHubPages = window.location.hostname.endsWith(".github.io");
    const imageListUrl = isGitHubPages ? GITHUB_IMAGES_API : "images.json";
    const response = await fetch(imageListUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Image list request failed (${response.status})`);
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
        throw new Error("The image list response is invalid");
    }

    const paths = isGitHubPages
        ? files
            .filter((file) =>
                file.type === "file" &&
                SUPPORTED_IMAGE_EXTENSION.test(file.name) &&
                typeof file.download_url === "string"
            )
            .map((file) => file.download_url)
        : files.map((filename) => `images/${encodeURIComponent(filename)}`);

    if (paths.length === 0) {
        throw new Error("The images folder contains no supported images");
    }

    return paths;
}

function chooseNewImage() {
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
            "Could not load the image list. Check the GitHub repository connection or start the local server.";
    }
}

startButton.addEventListener("click", startGame);
shuffleButton.addEventListener("click", resetPuzzle);
newImageButton.addEventListener("click", chooseNewImage);

initialiseGame();
