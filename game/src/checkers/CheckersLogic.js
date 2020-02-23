"use strict";
class CheckersLogic {
    constructor() {
        this.gamesStatus = [];
    };

    getBoardByIndex(index) {
        return this.gamesStatus[index].board
    }

    setNewRoom(roomNumber, board) {
        console.log("room numer setneweoom " + roomNumber);

        this.gamesStatus[roomNumber] = {
            isBlackTurn: false,
            eaten: [],
            board,
            endGamestate: { draw: false, win: false, isBlack: false },
            fifteenKingsMoveCounter: 0,
            legalMoveState: {
                legal: false,
                arrOfPiecesToDelete: [],
                inMiddleSequence: { is: false, from: { x: -1, y: -1 } },
                message: []
            }
        }
        console.log(this.gamesStatus);

    }

    isMoveLegal({ from, to }, index) {
        console.log("isMoveLegal INDEX" + index + "   { from, to }: " + JSON.stringify({ from, to }))//+ JSON.stringify(this.gamesStatus[index]));
        // console.log("isMoveLegal index " + index)

        this.gamesStatus[index].legalMoveState = {
            legal: false,
            arrOfPiecesToDelete: [],
            inMiddleSequence: this.gamesStatus[index].legalMoveState.inMiddleSequence,
            message: []
        }
        if (from == null || from.x == null || from.y == null ||
            to == null || to.x == null || to.y == null) {
            this.gamesStatus[index].legalMoveState.message.push("Position illegal!");
            return this.gamesStatus[index].legalMoveState;
        }
        else if (this.gamesStatus[index].board[to.y][to.x] != null) {
            this.gamesStatus[index].legalMoveState.message.push("Not Empty!");
            return this.gamesStatus[index].legalMoveState;
        } else if (this.gamesStatus[index].board[from.y][from.x].isBlack != this.gamesStatus[index].isBlackTurn) {
            this.gamesStatus[index].legalMoveState.message.push("Not your turn");
            return this.gamesStatus[index].legalMoveState;
        } else if (Math.abs(to.y - from.y) != Math.abs(to.x - from.x)) { //not diagonal
            this.gamesStatus[index].legalMoveState.message.push("Not diagonal")
            return this.gamesStatus[index].legalMoveState;
        } else if (!this.gamesStatus[index].board[from.y][from.x].isKing) { //not king
            if ((Math.abs(to.y - from.y) != 1 && Math.abs(to.y - from.y) != 2) || //diff then 1 | 2 step, pawn
                ((Math.abs(to.x - from.x) != 1 && Math.abs(to.x - from.x) != 2)))
                return this.gamesStatus[index].legalMoveState;
            else if (!(Math.abs(to.y - from.y) == 2 && Math.abs(to.x - from.x) == 2) &&
                (this.gamesStatus[index].board[from.y][from.x].isBlack && to.y < from.y ||
                    !this.gamesStatus[index].board[from.y][from.x].isBlack && to.y > from.y)) { //move worng direction 
                this.gamesStatus[index].legalMoveState.message.push("Wrong direction");
                return this.gamesStatus[index].legalMoveState;
            } else if (Math.abs(to.y - from.y) == 2 && Math.abs(to.x - from.x) == 2) { //check if eat
                let x = 0,
                    y = 0;
                let direction = this.getMoveDirection(from, to);
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
                if (this.gamesStatus[index].board[y][x] == null || this.gamesStatus[index].board[y][x].isBlack == this.gamesStatus[index].isBlackTurn) {
                    this.gamesStatus[index].legalMoveState.message.push("didn't eat!");
                    return this.gamesStatus[index].legalMoveState;
                } else {
                    this.gamesStatus[index].legalMoveState.legal = true;
                    this.gamesStatus[index].legalMoveState.arrOfPiecesToDelete.push({ x: x, y: y });
                    return this.gamesStatus[index].legalMoveState;
                }
            }
        } else { //king
            let direction = this.getMoveDirection(from, to);
            if (direction.rightDown)
                return this.isKingLegalMove(1, 1, from, to, this.gamesStatus[index].legalMoveState, index);
            else if (direction.leftDown)
                return this.isKingLegalMove(-1, 1, from, to, this.gamesStatus[index].legalMoveState, index);
            else if (direction.leftUp)
                return this.isKingLegalMove(-1, -1, from, to, this.gamesStatus[index].legalMoveState, index);
            else if (direction.rightUp)
                return this.isKingLegalMove(1, -1, from, to, this.gamesStatus[index].legalMoveState, index);
        }

        this.gamesStatus[index].legalMoveState.legal = true;
        return this.gamesStatus[index].legalMoveState;
    }

    isMoveTotalLegal(from, to, index) {
        let legalMoveState = this.isMoveLegal({ from, to }, index);
        let mustEatState = this.getPlayerMustEatState(index);
        if (!mustEatState.is ||
            (mustEatState.is && (mustEatState.move).filter(pos => (pos.fromX == from.x &&
                pos.fromY == from.y && pos.toX == to.x && pos.toY == to.y)).length > 0))
            if (legalMoveState.legal && (!legalMoveState.inMiddleSequence.is ||
                (legalMoveState.inMiddleSequence.is && from.x == legalMoveState.inMiddleSequence.from.x &&
                    from.y == legalMoveState.inMiddleSequence.from.y))) {
                legalMoveState.is = true;
                //update 15 moves
                this.updateFifteenMoves(this.gamesStatus[index], from);
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

    isKingLegalMove(stepI, stepJ, from, to, legalMoveState, index) {
        for (let i = parseInt(from.x) + stepI, j = parseInt(from.y) + stepJ; this.condition(parseInt(i), parseInt(to.x), parseInt(stepI)) && this.condition(j, to.y, stepJ); i += stepI, j += stepJ) {
            if (this.gamesStatus[index].board[j][i] != null) {
                if (this.gamesStatus[index].board[j][i].isBlack == this.gamesStatus[index].isBlackTurn || (this.gamesStatus[index].board[j][i].isBlack != this.gamesStatus[index].isBlackTurn &&
                    this.gamesStatus[index].board[j + stepJ][i + stepI] != null && this.gamesStatus[index].board[j + stepJ][i + stepI].isBlack != this.gamesStatus[index].isBlackTurn))
                    return legalMoveState;
                if (this.gamesStatus[index].board[j][i].isBlack != this.gamesStatus[index].isBlackTurn)
                    legalMoveState.arrOfPiecesToDelete.push({ x: i, y: j });
            }
        }
        legalMoveState.legal = true;
        return legalMoveState;
    }

    getEndGameState(index) {/////////////////////////////////////////////////////////////////////
        console.log("getEndGameState index:" + JSON.stringify(index));

        if (this.isDraw(this.gamesStatus[index]))
            return this.gamesStatus[index].endGamestate;
        this.isWin(this.gamesStatus[index], index);
        return this.gamesStatus[index].endGamestate;
    }


    isPlayerCanEatMore(from, index) {
        for (let k = 0; k < this.gamesStatus[index].board.length; k++) {
            for (let l = 0; l < this.gamesStatus[index].board.length; l++) {
                let to = { x: l, y: k };
                let legalState = this.isMoveLegal({ from, to }, index);
                if (legalState.legal && legalState.arrOfPiecesToDelete.length > 0) {
                    this.gamesStatus[index].legalMoveState.inMiddleSequence.is = true;
                    this.gamesStatus[index].legalMoveState.inMiddleSequence.from = from;
                    this.gamesStatus[index].legalMoveState.inMiddleSequence.from.x = parseInt(this.gamesStatus[index].legalMoveState.inMiddleSequence.from.x);
                    this.gamesStatus[index].legalMoveState.inMiddleSequence.from.y = parseInt(this.gamesStatus[index].legalMoveState.inMiddleSequence.from.y);
                    return { is: true, from: from };
                }
            }
        }
        return { is: false, from: { x: -1, y: -1 } };
    }

    getPlayerMustEatState(index) {
        let eatFromArr = [];
        if (this.gamesStatus[index].legalMoveState.inMiddleSequence.is) {
            eatFromArr.push({
                fromX: this.gamesStatus[index].legalMoveState.inMiddleSequence.from.x,
                fromY: this.gamesStatus[index].legalMoveState.inMiddleSequence.from.y,
                toX: -1,
                toY: -1
            });
            return { is: false, move: eatFromArr };
        }
        for (let i = 0; i < this.gamesStatus[index].board.length; i++) {
            for (let j = 0; j < this.gamesStatus[index].board.length; j++) {
                if (this.gamesStatus[index].board[i][j] != null && this.gamesStatus[index].board[i][j].isBlack == this.gamesStatus[index].isBlackTurn) {
                    for (let k = 0; k < this.gamesStatus[index].board.length; k++) {
                        for (let l = 0; l < this.gamesStatus[index].board.length; l++) {
                            let from = { x: j, y: i },
                                to = { x: l, y: k };
                            let moveState = this.isMoveLegal({ from, to }, index)
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
    checkAndUpadateMiddleSequenceState(legalMoveState, to, index) {//////////////////////////////////////////
        if (legalMoveState.arrOfPiecesToDelete.length > 0)
            legalMoveState.inMiddleSequence = this.isPlayerCanEatMore(to, index);
        else {
            this.gamesStatus[index].legalMoveState.inMiddleSequence.is = false;
        }
        if (!legalMoveState.inMiddleSequence.is) {
            this.gamesStatus[index].legalMoveState.inMiddleSequence.is = false;
            this.gamesStatus[index].isBlackTurn = !this.gamesStatus[index].isBlackTurn;
        }

    }

    updateFifteenMoves(ths, from) {
        if (ths.board[from.y][from.x].isKing && ths.legalMoveState.arrOfPiecesToDelete.length == 0)
            ths.fifteenKingsMoveCounter += 0.5;
        else
            ths.fifteenKingsMoveCounter = 0;
    }

    getMoveDirection(from, to) {
        console.log(216 + " " + from + " " + to)

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

    isDraw(ths) {
        // let isOnlyFifteenKingsMoveWithoutEating = (ths) => {
        //     if (ths.fifteenKingsMoveCounter >= 15)
        //         return true;
        //     return false;
        // }
        // if (isOnlyFifteenKingsMoveWithoutEating(ths))
        //     return true;
        console.log(ths);

        return ths.fifteenKingsMoveCounter >= 15;
    }


    isWin(ths, index) {
        if (this.isNoPiecesleft(ths))
            return true;
        else if (this.playerPiecesAllBlocked(ths, index)) {
            return true;
        }
        return false;
    }

    playerPiecesAllBlocked(ths, index) {
        console.log(252 + "  " + index);

        for (let i = 0; i < ths.board.length; i++) {
            for (let j = 0; j < ths.board.length; j++) {
                if (ths.board[i][j] != null && ths.board[i][j].isBlack == ths.isBlackTurn) {
                    for (let k = 0; k < ths.board.length; k++) {
                        for (let l = 0; l < ths.board.length; l++) {
                            let from = { x: j, y: i },
                                to = { x: l, y: k };
                            //if (this.isMoveLegal({ from, to }).legal, index)
                            if (this.isMoveLegal({ from, to }, index).legal)
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

    isNoPiecesleft(ths) {
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

}

module.exports = CheckersLogic