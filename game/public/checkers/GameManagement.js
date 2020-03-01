"use strict";
const socket = io()

class GameManagement {
    constructor() {
        this.boardManagement = new BoardManagement();
        this.graphics = new Graphics(this.boardManagement.symbolicBoard);
    }

    play() {

        let addEventMouseDownToImg = (img) => {
            img.addEventListener("mousedown", (e) => {
                e.preventDefault();
                mouseDown = true;
                currentImg = img;
                cureentDiv = currentImg.parentNode;
            });
        }

        let addEventsToNewPics = () => {
            imgs = document.querySelectorAll("img");
            for (let i = 0; i < imgs.length; i++) {
                if (imgs[i].classList != "event") {
                    cureentDiv = imgs[i].parentNode;
                    currentImg = imgs[i];
                    addEventMouseDownToImg(imgs[i]);
                    addEventMouseUpImg(imgs[i]);
                    imgs[i].classList = "event";
                }
            }
        }

        let addEventsToButtons = () => {
            document.getElementById("leave room").addEventListener("click", () => {
                handleEndGame({ userDecideToLeave: true })
            });
            document.getElementById("offer draw").addEventListener("click", () => {
                handleEndGame({ offerDraw: true })
            });
            document.getElementById("resign game").addEventListener("click", () => {
                handleEndGame({ resign: true })
            });
        }

        let addEventMouseUpImg = (img) => {
            img.addEventListener("mouseup", (e) => {
                e.preventDefault();
                mouseDown = false;
                console.log("game managmaent id: " + socket.id);

                let elements, from, to;
                try {
                    elements = getAllElementsFromPoint(e.clientX, e.clientY);
                    from = { x: parseInt(cureentDiv.getAttribute("x")), y: parseInt(cureentDiv.getAttribute("y")) };
                    to = { x: elements[1].getAttribute("x"), y: elements[1].getAttribute("y") };
                } catch (ex) {
                    console.log(ex);
                    return;
                }
                currentImg.removeAttribute('style');

                if (elements[1] != null) {
                    socket.emit('isMoveTotalLegal', { from, to }, (legalMoveState) => {
                        if (legalMoveState.is) {

                            this.boardManagement.makeMove(from, to, legalMoveState);

                            if (!legalMoveState.inMiddleSequence.is)
                                this.boardManagement.updateKingsIfNecessary(to);

                            this.graphics.renderMessages(legalMoveState.message);
                            this.graphics.renderPieces();
                            addEventsToNewPics();

                            socket.emit('getEndGameState', false, (endGameState) => {
                                handleEndGame(endGameState);
                            })
                        }
                        else
                            this.graphics.renderMessages(legalMoveState.message);
                    })
                }
                this.graphics.renderPieces();
                addEventsToNewPics();
                // socket.emit('getEndGameState', id, (endGameState) => {
                //     handleEndGame(endGameState);
                // })
            });
        }

        document.onmousemove = (mouseMoveEvent) => {
            mouseMoveEvent.preventDefault();
            if (mouseDown)
                this.graphics.renderMovingMouseDown(currentImg, mouseMoveEvent);
        }

        this.graphics.createAndRenderBoardAndPanel();
        this.graphics.renderPieces();
        let imgs = document.querySelectorAll("img");
        let currentImg, cureentDiv, mouseDown = false;
        addEventsToNewPics();
        addEventsToButtons();
        let board = this.boardManagement.getBoard()
        socket.emit('gameConfigured', { board }, (error) => {
            if (error) {
                alert(error)
                location.href = '/'
            }
        })


        socket.on('opponentMove', ({ from, to, legalMoveState }) => {
            this.boardManagement.makeMove(from, to, legalMoveState);
            if (!legalMoveState.inMiddleSequence.is)
                this.boardManagement.updateKingsIfNecessary(to);
            this.graphics.renderMessages(legalMoveState.message);
            this.graphics.renderPieces();
            addEventsToNewPics();
            socket.emit('getEndGameState', true, (endGameState) => {
                handleEndGame(endGameState);
            })
        })
    }
}


const finishGame = () => {
    socket.emit("leaveGame", (error) => {
        if (error) {
            alert('error leaving game: ' + error)
            return
        }
        else
            parent.removeIframe()
    })
}

let handleEndGame = (endGameState) => {
    if (endGameState.userDecideToLeave) {
        if (confirm("Are u sure u want to leave???"))
            finishGame()
    }
    else if (endGameState.offerDraw) {
        //   if (confirm((this.checkersLogic.isBlackTurn ? "Black" : "Red") + "  is offering a draw! Confirm???")) {
        if (!confirm("Are u sure u want to offer draw???")) {
            socket.emit("offerDraw", (error, isDrawAccepted) => {
                if (error)
                    alert('error offering draw: ' + error)
                else if (isDrawAccepted) {
                    alert('Draw acceptd by your opponents!!!')
                    finishGame()
                }
                else
                    alert("Draw isn't accepted!!!!")
            })
        }
    }
    else if (endGameState.resign) {
        //   if (confirm((this.checkersLogic.isBlackTurn ? "Black" : "Red") + "  is offering a draw! Confirm???")) {
        if (!confirm("Are u sure u want to resign?????")) {
            socket.emit("resign", (error) => {
                if (error)
                    alert('error resigning!! error: ' + error)
                else
                    finishGame()
            })
        }
    }
    else if (endGameState.opponentLeft) {
        alert("Unfourtenlly your opponents left the room :(")
        finishGame()
    } else if (endGameState.win) {
        alert(endGameState.isBlack ? "Black WON!!" : "Red WON!!!");
        finishGame()
    } else if (endGameState.isDraw) {
        alert("DRAW!!!");
        finishGame()
    }
}

socket.on('opponentAsk4Draw', (callback) => {
    if (confirm("Your opponents ask for draw!! confirm???"))
        callback(true)
    callback(false)
})

socket.on('opponentLeft', () => {
    console.log("opponent left");
    handleEndGame({ win: false, isDraw: false, isWhite: false, opponentLeft: true })
})

socket.on('error', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})
socket.on('err', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})
