"use strict";
const initialBoard = [
    0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1, 0,
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 2, 0, 2, 0, 2, 0,
    0, 2, 0, 2, 0, 2, 0, 2,
    2, 0, 2, 0, 2, 0, 2, 0
];

class BoardManagement {

    constructor() {
        this.symbolicBoard = this.setSymbolicBoard(initialBoard);
    }

    setSymbolicBoard(initialBoard) {
        let sb = setBoardSize(initialBoard);
        for (let k = 0; k < sb.length; k++) {
            for (let l = 0; l < sb.length; l++) {
                sb[k][l] = (initialBoard[l + k * sb.length] == 1) ? new CheckersPiece(true, false) : sb[k][l];
                sb[k][l] = (initialBoard[l + k * sb.length] == 2) ? new CheckersPiece(false, false) : sb[k][l];
                sb[k][l] = (initialBoard[l + k * sb.length] == 3) ? new CheckersPiece(true, true) : sb[k][l];
                sb[k][l] = (initialBoard[l + k * sb.length] == 4) ? new CheckersPiece(false, true) : sb[k][l];
            }
        }
        return sb;
    }

    makeMove(from, to, legalMoveState) {
        this.symbolicBoard[to.y][to.x] = this.symbolicBoard[from.y][from.x]; //normal move
        this.symbolicBoard[from.y][from.x] = null;
        this.deleteEatenPieces(legalMoveState);
    }

    updateKingsIfNecessary(to) {
        if (to.y == this.symbolicBoard.length - 1 && this.symbolicBoard[to.y][to.x].isBlack && !this.symbolicBoard[to.y][to.x].isKing) {
            this.symbolicBoard[to.y][to.x] = new CheckersPiece(this.symbolicBoard[to.y][to.x].isBlack, true);
        } else if (to.y == 0 && !this.symbolicBoard[to.y][to.x].isBlack && !this.symbolicBoard[to.y][to.x].isKing) {
            this.symbolicBoard[to.y][to.x] = new CheckersPiece(this.symbolicBoard[to.y][to.x].isBlack, true);
        }
    }

    deleteEatenPieces(legalMoveState) {
        if (legalMoveState.arrOfPiecesToDelete.length > 0)
            for (let k = 0; k < legalMoveState.arrOfPiecesToDelete.length; k++) {
                let pos = legalMoveState.arrOfPiecesToDelete[k];
                this.symbolicBoard[pos.y][pos.x] = null;
            }
    }
}