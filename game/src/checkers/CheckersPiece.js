"use strict";
class CheckersPiece {
    constructor(isBlack, isKing) {
        this.isBlack = isBlack;
        this.isKing = isKing;
        // {"isBlack":false,"isKing":false,"img":{}}
        this.img = {}// document.createElement("img");
        this.img.src = (isBlack && !isKing) ? "pics/blackPawn.png" : this.img.src;
        this.img.src = (!isBlack && !isKing) ? "pics/redPawn.png" : this.img.src;
        this.img.src = (isBlack && isKing) ? "pics/blackKing.png" : this.img.src;
        this.img.src = (!isBlack && isKing) ? "pics/redKing.png" : this.img.src;
    }
}

module.exports = CheckersPiece