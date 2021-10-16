var socket;
var activeValue = null;
var usernameKey = "username";
var alreadyShowed = false;

(function() {
    socket = new WebSocket("ws://" + window.location.host + "/websocket");

    _listenRemote();
    setTimeout(() => _initState(), 250);
})()

function clickCard(value) {
    if(value != activeValue) {
        $(`#c${activeValue}`).removeClass('active');
        $(`#c${value}`).addClass('active');
        activeValue = value;
        _sendEvent('CardChoosed', value);
    }
}

function resetTable() {
    _sendEvent('ResetCards', null);
}

async function showCards() {
    if(!alreadyShowed) {
        _sendEvent('ShowCards', null);
        for(i = 3; i > 0; i--) {
            const text = `<p>Mostrando cartas em ${i}</p>`
            $('#table').html(text);
            await _sleep(1000);
        }

        _showResetButton();
        alreadyShowed = true;
    }
}

function _initState() {
    _setUsername();

    // Confirma se usuario quer sair da pagina
    window.onbeforeunload = exitEvent;
    function exitEvent() {
        _sendEvent('PlayerDisconnected', null);
    }
}

function _sendEvent(event, value) {
    const username = localStorage.getItem(usernameKey);
    socket.send(
        JSON.stringify({
            username,
            value,
            event
        })
    )
}

function _setUsername() {
    
    let username = localStorage.getItem(usernameKey);
    if(!username) {
        username = Math.floor(Math.random() * 100000) + 1;
        localStorage.setItem(usernameKey, username);
    }

    $("#me").html(username);
    $("#username").html(username);

    _sendEvent('PlayerConnected', null);
}

function _listenRemote() {
    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        switch (data.event) {
            case 'PlayerConnected':
                _handlePlayerConnected(data.username);
                break;
            case 'CardChoosed':
                _handleCardChoosed(data);
                break;
            case 'PlayerDisconnected':
                _handlePlayerDisconnected(data.username);
                break;
            case 'ShowCardsButton':
                _handleShowCardsButton();
                break;
            case 'ShowCards':
                showCards();
                break;
            case 'ResetCards':
                _handleResetCards();
                break;
        }
    });
}

function _handleCardChoosed(data) {
    let card = null;
    const msg = data.value == 'z' ? '?' : data.value;

    if(data.username == localStorage.getItem(usernameKey)) {
        card = $("#my-value");
        card.removeClass();
        card.addClass('btn');
        card.addClass('btn-card');
    } else {
        card = $(`#pc-${data.username}`);
        card.removeClass();
        card.addClass('card-back');
    }

    card.html(msg);
}

function _handlePlayerConnected(newUsername) {
    const username = localStorage.getItem(usernameKey);
    if(username !== newUsername) {
        newUsername = newUsername.replace(/\"/g,"");
        const player = _newPlayerTemplate(newUsername);
        $('.players-position').append(player);
    }
}

function _handlePlayerDisconnected(username) {
    $(`#pc-${username}`).remove();
}

function _handleShowCardsButton() {
    const button = _newButtonActionTemplate('Mostrar cartas', 'showCards');
    $('#table').html(button);
}

function _showResetButton() {
    const button = _newButtonActionTemplate('Zerar mesa', 'resetTable');
    $('#table').html(button);
}

function _newButtonActionTemplate(text, action) {
    return `<button onclick="${action}()" class="btn btn-black">${text}</button>`
}

function _handleResetCards() {
    const tableText = '<p>Escolham suas cartas!</p>';
    $('#table').html(tableText);
    
    $('#my-value').removeClass();
    $('#my-value').html("");
    $('#my-value').addClass('no-card');

    $('div[card]').removeClass();
    $('div[card]').addClass('no-card');
    $('div[card]').html("");
}

function _newPlayerTemplate(username) {
    return `
        <div class="player">
            <b>${username}</b>
            <div id="pc-${username}" card class="no-card"></div>
        </div>
    `;
}

function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }