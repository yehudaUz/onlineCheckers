"use strict";

function insertElementToDOM(elementToAppenTo, elementToInsert) {
    let perent = document.querySelector(elementToAppenTo);
    perent.appendChild(elementToInsert);
};

function deleteFromDom(elmentType) {
    let childrens = document.body.childNodes;
    for (let i = 0; i < childrens.length; i++) {
        if (childrens[i].nodeName.toLocaleLowerCase() == elmentType);
        childrens[i].parentElement.removeChild(childrens[i]);
    }
};

function getAllElementsFromPoint(x, y) {
    var elements = [];
    var display = [];
    var item = document.elementFromPoint(x, y);
    while (item && item !== document.body && item !== window && item !== document && item !== document.documentElement) {
        elements.push(item);
        display.push(item.style.display);
        item.style.display = "none";
        item = document.elementFromPoint(x, y);
    }
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = display[i];
    }
    return elements;
}

function setBoardSize(arr) {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}