'use strict';

let chosenTeam, statBlock, errorBlock, votesBlock, success,textarea;

window.onload = async function () {
    statBlock = document.getElementById('stat');
    votesBlock = document.getElementById('votesBlock');
    errorBlock = document.getElementById('error');
    success = document.getElementById('success');
    textarea = document.getElementById('textarea');
    await getStat();
    await showVotesBlock();
};

async function makeChoise(e) {
    let voteFetch = await fetch('/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({teamId: chosenTeam})
    });
    let vote = await voteFetch.json();
    if (vote.errorCode === 1) errorBlock.innerText = vote.description;
    if (vote.errorCode === 0) {
        errorBlock.innerText = '';
        statBlock.innerText = '';
        votesBlock.innerText = '';
        success.innerHTML = '<h2>Ваш голос принят</h2>';
        await getStat();
    }
}

async function showStat (type) {
    const fetchOptions={
        method: 'POST',
        headers: {
            'Accept': type,
        },
    };
    const response=await fetch('/showStat',fetchOptions);
    const text=await response.text();
    textarea.innerText = text;
}

async function getStat() {
    let statFetch = await fetch('/stat', {
        method: 'GET',
    });
    let stat = await statFetch.json();
    let currentStat = document.createElement('h2');
    currentStat.innerText = 'Текущие результаты:';
    statBlock.appendChild(currentStat);
    for (let key in stat) {
        let team = document.createElement('p');
        team.innerText = ( 'Вариант: ' + key + ' - ' + stat[key] + ' голосов' );
        statBlock.appendChild(team);
    }
}

async function showVotesBlock() {
    let variantsFetch = await fetch('/variants');
    let variants = await variantsFetch.json();
    let supportMessage = document.createElement('h2');
    supportMessage.innerText = 'Поддержи любимую команду:';
    votesBlock.appendChild(supportMessage);

    let form = document.createElement('form');
    form.setAttribute('name', 'votesForm');
    variants.forEach( item => {
        let team = document.createElement('input');
        team.setAttribute('type', 'radio');
        team.setAttribute('name', 'bestTeam');
        team.setAttribute('value', item.id);
        team.onclick = setChosenTeam;
        form.appendChild(team);
        let teamName = document.createElement('span');
        teamName.innerText = item.team;
        form.appendChild(teamName);
        let teamBr = document.createElement('br');
        form.appendChild(teamBr);
    })
    votesBlock.appendChild(form);

    let pushVote = document.createElement('div');
    pushVote.innerText = 'Проголосовать';
    pushVote.style.cssText = 'background-color: lightGrey; border-radius: 8px; font-size: 20px;' +
        'font-weight: bold; margin-top: 10px; padding: 10px 15px; display: inline-block';
    pushVote.onclick = makeChoise;
    votesBlock.appendChild(pushVote);
}

function setChosenTeam(e) {
    chosenTeam = e.target.value;
}