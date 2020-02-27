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
            document.getElementById("new game!!").addEventListener("click", () => {
                socket.emit('getEndGameState', false, (endGameState) => {
                    if (confirm("Are u sure u want to start a new game???"))
                        window.location.reload(false);
                })
            });
            document.getElementById("offer draw").addEventListener("click", () => {
                socket.emit('getEndGameState', false, (endGameState) => {
                    if (confirm((this.checkersLogic.isBlackTurn ? "Black" : "Red") + "  is offering a draw! Confirm???")) {
                        endGameState.isDraw = true;
                        handleEndGame(endGameState);
                    }
                })
            });
            document.getElementById("resign game").addEventListener("click", () => {
                socket.emit('getEndGameState', false, (endGameState) => {
                    if (confirm("Are u sure u want to loose the game?????")) {
                        endGameState.win = true;
                        endGameState.isBlack = !this.checkersLogic.isBlackTurn;
                        handleEndGame(endGameState);
                    }
                })

            });
        }

        let addEventMouseUpImg = (img) => {
            img.addEventListener("mouseup", (e) => {
                e.preventDefault();
                mouseDown = false;

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
                            //socket.emit('makeMove', { from, to }, (error) => {
                            this.boardManagement.makeMove(from, to, legalMoveState);
                            //socket.emit('checkAndUpadateMiddleSequenceState', { legalMoveState, to }, (error) => {
                            // if (error) {
                            //     alert(error)
                            // }
                            if (!legalMoveState.inMiddleSequence.is)
                                this.boardManagement.updateKingsIfNecessary(to);
                            this.graphics.renderMessages(legalMoveState.message);
                            this.graphics.renderPieces();
                            addEventsToNewPics();
                            socket.emit('getEndGameState', false, (endGameState) => {
                                handleEndGame(endGameState);
                            })
                            //  })
                            //})
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
            // let f = { x: 0, y: 0 }, t = { x: 0, y: 0 }
            // socket.emit('isMoveTotalLegal', { f, t })
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



let handleEndGame = (endGameState) => {
    if (endGameState.opponentLeft) {
        alert("Unfourtenlly your opponents left the room :(")
        parent.removeIframe()
        return;
    } else if (endGameState.win) {
        alert(endGameState.isBlack ? "Black WON!!" : "Red WON!!!");
        parent.removeIframe()
        return;
    } else if (endGameState.isDraw) {
        alert("DRAW!!!");
        parent.removeIframe()
        return;
    }
}

socket.on('opponentLeft', () => {
    handleEndGame({ win: false, isDraw: false, isWhite: false, opponentLeft: true })
})

socket.on('error', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})

// socket.on('pleaseCheckConnection',()=> {
//     console.log("pleaseCheckConnection");

//     socket.emit('checkConnection')
// })
