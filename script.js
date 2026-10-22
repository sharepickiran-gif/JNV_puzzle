const IMAGE_PATH = "images/JNV_gate.png";
const GRID_SIZE = 4;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;

const puzzleBoard = document.getElementById("puzzle-board");
const piecesContainer = document.getElementById("pieces-container");
const message = document.getElementById("message");
const shuffleButton = document.getElementById("shuffle-button");

let selectedPiece = null;

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
    piece.draggable = true;

    piece.dataset.pieceId = id;
    piece.style.backgroundImage = `url("${IMAGE_PATH}")`;
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
        message.textContent =
            "Congratulations! You have assembled the JNV campus! 🎉";
    } else {
        message.textContent = "";
    }
}

// Start or restart the puzzle.
function startGame() {
    createBoard();
    shufflePieces();
}

shuffleButton.addEventListener("click", startGame);

// Initialise the game.
startGame();
