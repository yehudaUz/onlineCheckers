"use strict";
const initialBoardWhite = [
    0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1, 0,
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 2, 0, 2, 0, 2, 0,
    0, 2, 0, 2, 0, 2, 0, 2,
    2, 0, 2, 0, 2, 0, 2, 0
];
const initialBoardBlack = [
    0, 2, 0, 2, 0, 2, 0, 2,
    2, 0, 2, 0, 2, 0, 2, 0,
    0, 2, 0, 2, 0, 2, 0, 2,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 1, 0, 1, 0, 1, 0,
    0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1, 0
];

class BoardManagement {
    constructor() {//get user color
        window.parent.document.getElementById('userColorWhite') ? this.isUserBlack = false : this.isUserBlack = true
        if (this.isUserBlack) //set board accordingly
            this.symbolicBoard = this.setSymbolicBoard(initialBoardBlack);
        else
            this.symbolicBoard = this.setSymbolicBoard(initialBoardWhite);
    }

    setBoardSize(arr) {
        let length;
        if (arr[0].constructor === Array)
            length = arr[0].length;
        else
            length = Math.sqrt(arr.length);
        let newArr = new Array(length);
        for (let i = 0; i < length; i++) {
            newArr[i] = new Array(length);
        }
        return newArr;
    }

    setSymbolicBoard(initialBoard) {
        let sb = this.setBoardSize(initialBoard);
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
        if (!this.isUserBlack) {
            this.symbolicBoard[to.y][to.x] = this.symbolicBoard[from.y][from.x];
            this.symbolicBoard[from.y][from.x] = null;
        }
        else { //black user is oopsite down so flipping it
            this.symbolicBoard[7 - to.y][7 - to.x] = this.symbolicBoard[7 - from.y][7 - from.x];
            this.symbolicBoard[7 - from.y][7 - from.x] = null;
        }
        this.deleteEatenPieces(legalMoveState);
    }

    updateKingsIfNecessary(to) { //if pawn become king update it
        if (!this.isUserBlack) {
            if (to.y == this.symbolicBoard.length - 1 && this.symbolicBoard[to.y][to.x].isBlack && !this.symbolicBoard[to.y][to.x].isKing) {
                this.symbolicBoard[to.y][to.x] = new CheckersPiece(this.symbolicBoard[to.y][to.x].isBlack, true);
            } else if (to.y == 0 && !this.symbolicBoard[to.y][to.x].isBlack && !this.symbolicBoard[to.y][to.x].isKing) {
                this.symbolicBoard[to.y][to.x] = new CheckersPiece(this.symbolicBoard[to.y][to.x].isBlack, true);
            }
        } else {
            if (to.y == this.symbolicBoard.length - 1 && this.symbolicBoard[7 - to.y][7 - to.x].isBlack && !this.symbolicBoard[7 - to.y][7 - to.x].isKing) {
                this.symbolicBoard[7 - to.y][7 - to.x] = new CheckersPiece(true, true);
            } else if (to.y == 0 && !this.symbolicBoard[7 - to.y][7-to.x].isBlack && !this.symbolicBoard[7 - to.y][7 - to.x].isKing) {
                this.symbolicBoard[7 - to.y][7 - to.x] = new CheckersPiece(false, true);
            }
        }
    }


    deleteEatenPieces(legalMoveState) {
        if (legalMoveState.arrOfPiecesToDelete.length > 0)
            for (let k = 0; k < legalMoveState.arrOfPiecesToDelete.length; k++) {
                let pos = legalMoveState.arrOfPiecesToDelete[k];
                if (this.isUserBlack) //same here again, black is flipped
                    this.symbolicBoard[7 - pos.y][7 - pos.x] = null;
                else
                    this.symbolicBoard[pos.y][pos.x] = null;
            }
    }

    getBoard() {
        return this.symbolicBoard;
    }
}
