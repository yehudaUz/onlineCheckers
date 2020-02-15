
function renderError() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('msg'))
        document.getElementById('errorMessage').innerHTML = urlParams.get('msg');
    else
        document.getElementById('errorMessage').innerHTML = "Error"
}

renderError()