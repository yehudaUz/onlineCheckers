"use strict";
class CheckersLogic {
    constructor(board, graphics) {
        this.isBlackTurn = false;
        this.eaten = [];
        this.board = board;
        this.endGamestate = { draw: false, win: false, isBlack: false };
        this.fifteenKingsMoveCounter = 0;
        this.legalMoveState = {
            legal: false,
            arrOfPiecesToDelete: [],
            inMiddleSequence: { is: false, from: { x: -1, y: -1 } },
            message: []
        };
        this.graphics = graphics;
    };

    isMoveLegal({ from, to }) {
        this.legalMoveState = {
            legal: false,
            arrOfPiecesToDelete: [],
            inMiddleSequence: this.legalMoveState.inMiddleSequence,
            message: []
        }
        if (to == null || to.x == null || to.y == null || this.board[to.y][to.x] != null) {
            this.legalMoveState.message.push("Not Empty!");
            return this.legalMoveState;
        } else if (this.board[from.y][from.x].isBlack != this.isBlackTurn) {
            this.legalMoveState.message.push("Not your turn");
            return this.legalMoveState;
        } else if (Math.abs(to.y - from.y) != Math.abs(to.x - from.x)) { //not diagonal
            this.legalMoveState.message.push("Not diagonal");
            return this.legalMoveState;
        } else if (!this.board[from.y][from.x].isKing) { //not king
            if ((Math.abs(to.y - from.y) != 1 && Math.abs(to.y - from.y) != 2) || //diff then 1 | 2 step, pawn
                ((Math.abs(to.x - from.x) != 1 && Math.abs(to.x - from.x) != 2)))
                return this.legalMoveState;
            else if (!(Math.abs(to.y - from.y) == 2 && Math.abs(to.x - from.x) == 2) &&
                (this.board[from.y][from.x].isBlack && to.y < from.y ||
                    !this.board[from.y][from.x].isBlack && to.y > from.y)) { //move worng direction 
                this.legalMoveState.message.push("Wrong direction");
                return this.legalMoveState;
            } else if (Math.abs(to.y - from.y) == 2 && Math.abs(to.x - from.x) == 2) { //check if eat
                let x = 0,
                    y = 0;
                let direction = getMoveDirection(from, to);
                if (direction.rightDown) {
                    x = parseInt(to.x) - 1;
                    y = parseInt(to.y) - 1;
                } else if (direction.leftDown) {
                    x = parseInt(to.x) + 1;
                    y = parseInt(to.y) - 1;
                } else if (direction.leftUp) {
                    x = parseInt(to.x) + 1;
                    y = parseInt(to.y) + 1;
                } else if (direction.rightUp) {
                    x = parseInt(to.x) - 1;
                    y = parseInt(to.y) + 1;
                }
                if (this.board[y][x] == null || this.board[y][x].isBlack == this.isBlackTurn) {
                    this.legalMoveState.message.push("didn't eat!");
                    return this.legalMoveState;
                } else {
                    this.legalMoveState.legal = true;
                    this.legalMoveState.arrOfPiecesToDelete.push({ x: x, y: y });
                    return this.legalMoveState;
                }
            }
        } else { //king
            let direction = getMoveDirection(from, to);
            if (direction.rightDown)
                return this.isKingLegalMove(1, 1, from, to, this.legalMoveState);
            else if (direction.leftDown)
                return this.isKingLegalMove(-1, 1, from, to, this.legalMoveState);
            else if (direction.leftUp)
                return this.isKingLegalMove(-1, -1, from, to, this.legalMoveState);
            else if (direction.rightUp)
                return this.isKingLegalMove(1, -1, from, to, this.legalMoveState);
        }

        this.legalMoveState.legal = true;
        return this.legalMoveState;
    }

    isMoveTotalLegal(from, to) {
        let legalMoveState = this.isMoveLegal({ from, to }, this.board);
        let mustEatState = this.getPlayerMustEatState();
        if (!mustEatState.is ||
            (mustEatState.is && (mustEatState.move).filter(pos => (pos.fromX == from.x &&
                pos.fromY == from.y && pos.toX == to.x && pos.toY == to.y)).length > 0))
            if (legalMoveState.legal && (!legalMoveState.inMiddleSequence.is ||
                    (legalMoveState.inMiddleSequence.is && from.x == legalMoveState.inMiddleSequence.from.x &&
                        from.y == legalMoveState.inMiddleSequence.from.y))) {
                legalMoveState.is = true;
                //update 15 moves
                updateFifteenMoves(this, from);
                return legalMoveState
            }
        if ((mustEatState.is && !(mustEatState.move).filter(pos => (pos.fromX == from.x &&
                pos.fromY == from.y && pos.toX == to.x && pos.toY == to.y)).length > 0))
            legalMoveState.message.push("Must Eat!");
        if (legalMoveState.inMiddleSequence.is)
            legalMoveState.message.push("Must Eat! (continue the sequence)");
        legalMoveState.is = false;
        return legalMoveState;
    }


    condition(start, end, step) {
        if (step < 0)
            return start >= end;
        else
            return start <= end;
    }

    isKingLegalMove(stepI, stepJ, from, to, legalMoveState) {
        for (let i = parseInt(from.x) + stepI, j = parseInt(from.y) + stepJ; this.condition(parseInt(i), parseInt(to.x), parseInt(stepI)) && this.condition(j, to.y, stepJ); i += stepI, j += stepJ) {
            if (this.board[j][i] != null) {
                if (this.board[j][i].isBlack == this.isBlackTurn || (this.board[j][i].isBlack != this.isBlackTurn &&
                        this.board[j + stepJ][i + stepI] != null && this.board[j + stepJ][i + stepI].isBlack != this.isBlackTurn))
                    return legalMoveState;
                if (this.board[j][i].isBlack != this.isBlackTurn)
                    legalMoveState.arrOfPiecesToDelete.push({ x: i, y: j });
            }
        }
        legalMoveState.legal = true;
        return legalMoveState;
    }

    getEndGameState() {
        if (isDraw(this))
            return this.endGamestate;
        isWin(this);
        return this.endGamestate;
    }


    isPlayerCanEatMore = (from) => {
        for (let k = 0; k < this.board.length; k++) {
            for (let l = 0; l < this.board.length; l++) {
                let to = { x: l, y: k };
                let legalState = this.isMoveLegal({ from, to });
                if (legalState.legal && legalState.arrOfPiecesToDelete.length > 0) {
                    this.legalMoveState.inMiddleSequence.is = true;
                    this.legalMoveState.inMiddleSequence.from = from;
                    this.legalMoveState.inMiddleSequence.from.x = parseInt(this.legalMoveState.inMiddleSequence.from.x);
                    this.legalMoveState.inMiddleSequence.from.y = parseInt(this.legalMoveState.inMiddleSequence.from.y);
                    return { is: true, from: from };
                }
            }
        }
        return { is: false, from: { x: -1, y: -1 } };
    }

    getPlayerMustEatState() {
        let eatFromArr = [];
        if (this.legalMoveState.inMiddleSequence.is) {
            eatFromArr.push({
                fromX: this.legalMoveState.inMiddleSequence.from.x,
                fromY: this.legalMoveState.inMiddleSequence.from.y,
                toX: -1,
                toY: -1
            });
            return { is: false, move: eatFromArr };
        }
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board.length; j++) {
                if (this.board[i][j] != null && this.board[i][j].isBlack == this.isBlackTurn) {
                    for (let k = 0; k < this.board.length; k++) {
                        for (let l = 0; l < this.board.length; l++) {
                            let from = { x: j, y: i },
                                to = { x: l, y: k };
                            let moveState = this.isMoveLegal({ from, to });
                            if (moveState.legal && moveState.arrOfPiecesToDelete.length > 0)
                                eatFromArr.push({ fromX: from.x, fromY: from.y, toX: to.x, toY: to.y });
                        }
                    }
                }
            }
        }
        if (eatFromArr.length > 0)
            return { is: true, move: eatFromArr };
        return { is: false, move: eatFromArr };
    }
    checkAndUpadateMiddleSequenceState(legalMoveState, to) {
        if (legalMoveState.arrOfPiecesToDelete.length > 0)
            legalMoveState.inMiddleSequence = this.isPlayerCanEatMore(to);
        else {
            this.legalMoveState.inMiddleSequence.is = false;
        }
        if (!legalMoveState.inMiddleSequence.is)
            this.legalMoveState.inMiddleSequence.is = false;
    }
}

let updateFifteenMoves = (ths, from) => {
    if (ths.board[from.y][from.x].isKing && ths.legalMoveState.arrOfPiecesToDelete.length == 0)
        ths.fifteenKingsMoveCounter += 0.5;
    else
        ths.fifteenKingsMoveCounter = 0;
}

let getMoveDirection = (from, to) => {
    let diagonalDirction = { rightUp: false, rightDown: false, leftDown: false, leftUp: false };
    if (to.y > from.y && to.x > from.x)
        diagonalDirction.rightDown = true;
    else if (to.y > from.y && to.x < from.x)
        diagonalDirction.leftDown = true;
    else if (to.y < from.y && to.x < from.x)
        diagonalDirction.leftUp = true;
    else if (to.y < from.y && to.x > from.x)
        diagonalDirction.rightUp = true;
    return diagonalDirction;
}

let isDraw = (ths) => {
    // let isOnlyFifteenKingsMoveWithoutEating = (ths) => {
    //     if (ths.fifteenKingsMoveCounter >= 15)
    //         return true;
    //     return false;
    // }
    // if (isOnlyFifteenKingsMoveWithoutEating(ths))
    //     return true;
    return ths.fifteenKingsMoveCounter >= 15;
}

let isWin = (ths) => {
    if (isNoPiecesleft(ths))
        return true;
    else if (playerPiecesAllBlocked(ths)) {
        return true;
    }
    return false;
}

let playerPiecesAllBlocked = (ths) => {
    for (let i = 0; i < ths.board.length; i++) {
        for (let j = 0; j < ths.board.length; j++) {
            if (ths.board[i][j] != null && ths.board[i][j].isBlack == ths.isBlackTurn) {
                for (let k = 0; k < ths.board.length; k++) {
                    for (let l = 0; l < ths.board.length; l++) {
                        let from = { x: j, y: i },
                            to = { x: l, y: k };
                        if (ths.isMoveLegal({ from, to }).legal)
                            return false;
                    }
                }
            }
        }
    }
    ths.endGamestate.win = true;
    ths.endGamestate.isBlack = !ths.isBlackTurn;
    return true
}

let isNoPiecesleft = (ths) => {
    let whiteHavePieces = false,
        blackHavePieces = false;
    for (let i = 0; i < ths.board.length; i++) {
        for (let j = 0; j < ths.board.length; j++) {
            if (ths.board[i][j] != null) {
                if (ths.board[i][j].isBlack)
                    blackHavePieces = true;
                else
                    whiteHavePieces = true;
            }
            if (whiteHavePieces && blackHavePieces)
                return false;
        }
    }
    ths.endGamestate.win = true;
    if (whiteHavePieces)
        ths.endGamestate.isBlack = false
    else
        ths.endGamestate.isBlack = true;
    return true;
}