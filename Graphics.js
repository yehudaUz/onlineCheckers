"use strict";
class Graphics {
    constructor(symbolicBoard) {
        this.symbolicBoard = symbolicBoard;
        this.divsBoard = setBoardSize(symbolicBoard);
        this.messages = [];
    }
    renderPieces() {
        let allImages = document.querySelectorAll("img");
        for (var i = 0; i < allImages.length; i++)
            allImages[i].parentElement.removeChild(allImages[i]);
        for (let k = 0; k < this.symbolicBoard.length; k++) {
            for (let l = 0; l < this.symbolicBoard.length; l++) {
                if (this.symbolicBoard[k][l] != null)
                    this.divsBoard[k][l].appendChild(this.symbolicBoard[k][l].img);
            }
        }
    }
    createAndRenderBoardAndPanel() {
        document.querySelector("body").style.visibility = "visible";
        let isWhite = true;
        let gameDiv = document.createElement("div"),
            gameBoardDiv = document.createElement("div"),
            panelDiv = new Panel();
        let header = document.createElement("h1");
        header.innerText = "WELCOME TO CHECKERS!";
        gameDiv.appendChild(header);

        gameDiv.id = "game", gameBoardDiv.id = "gameBoard", panelDiv.id = "panel";
        insertElementToDOM("body", gameDiv);
        gameDiv.appendChild(gameBoardDiv);
        gameDiv.appendChild(panelDiv);

        for (let k = 0; k < this.symbolicBoard.length; k++) {
            gameBoardDiv.appendChild(document.createElement("br"));
            for (let l = 0; l < this.symbolicBoard.length; l++) {
                this.divsBoard[k][l] = document.createElement("div");
                isWhite = l != 0 ? !isWhite : isWhite;
                this.divsBoard[k][l].classList = isWhite ? "white" : "black";
                this.divsBoard[k][l].setAttribute("x", l);
                this.divsBoard[k][l].setAttribute("y", k);
                gameBoardDiv.appendChild(this.divsBoard[k][l]);
            }
        }

        let messages = document.createElement("h1");
        messages.id = "messages";
        messages.textContent = "";
        gameBoardDiv.appendChild(messages);

    }
    renderMovingMouseDown(currentImg, mouseMoveEvent) {
        currentImg.style.position = "absolute";
        currentImg.style.height = "7.65vh";
        currentImg.style.width = "3.825vw";
        document.querySelector("html").appendChild(currentImg);
        currentImg.style.left = mouseMoveEvent.clientX - currentImg.width / 2 + 'px';
        currentImg.style.top = mouseMoveEvent.clientY - currentImg.height / 2 + 'px';
    }
    renderMessages(messages) {
        for (let i = 0; i < messages.length; i++) {
            document.getElementById("messages").innerText = messages[i];
            document.getElementById("messages").classList = "blinking";
            sleep(2000).then(() => {
                document.getElementById("messages").innerText = ""
            })
        }
        messages = [];
    }
    pushMessages(msg) {
        this.messages.push(msg);
    }
}

class Panel {
    constructor() {
        this.panelDiv = document.createElement("div");
        this.makeButton("new game!!");
        this.makeButton("offer draw");
        this.makeButton("resign game");
        return this.panelDiv;
    }
    makeButton(name, action) {
        let newButton = document.createElement("button");
        newButton.id = name;
        //newButton.addEventListener("click", action);
        newButton.innerText = newButton.id.toUpperCase();
        this.panelDiv.appendChild(newButton);
    }
}