const CheckersPiece = require('./CheckersPiece')

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
    //    board = this.setSymbolicBoard(initialBoard);
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

    // setSymbolicBoard(initialBoard) {
    //     let sb = this.setBoardSize(initialBoard);
    //     for (let k = 0; k < sb.length; k++) {
    //         for (let l = 0; l < sb.length; l++) {
    //             sb[k][l] = (initialBoard[l + k * sb.length] == 1) ? new CheckersPiece(true, false) : sb[k][l];
    //             sb[k][l] = (initialBoard[l + k * sb.length] == 2) ? new CheckersPiece(false, false) : sb[k][l];
    //             sb[k][l] = (initialBoard[l + k * sb.length] == 3) ? new CheckersPiece(true, true) : sb[k][l];
    //             sb[k][l] = (initialBoard[l + k * sb.length] == 4) ? new CheckersPiece(false, true) : sb[k][l];
    //         }
    //     }
    //     return sb;
    // }

    makeMove(from, to, legalMoveState,board) {
        board[to.y][to.x] = board[from.y][from.x]; //normal move
        board[from.y][from.x] = null;
        this.deleteEatenPieces(legalMoveState,board);
    }

    updateKingsIfNecessary(to,board) {
        console.log(JSON.stringify(board));
        if (to.y == board.length - 1 && board[to.y][to.x].isBlack && !board[to.y][to.x].isKing) {
            board[to.y][to.x] = new CheckersPiece(board[to.y][to.x].isBlack, true);
        } else if (to.y == 0 && !board[to.y][to.x].isBlack && !board[to.y][to.x].isKing) {
            board[to.y][to.x] = new CheckersPiece(board[to.y][to.x].isBlack, true);
        }
    }

    deleteEatenPieces(legalMoveState,board) {
        if (legalMoveState.arrOfPiecesToDelete.length > 0)
            for (let k = 0; k < legalMoveState.arrOfPiecesToDelete.length; k++) {
                let pos = legalMoveState.arrOfPiecesToDelete[k];
                board[pos.y][pos.x] = null;
            }
    }

    getBoard() {
        return board;
    }
}

module.exports = BoardManagement