const chatButton = document.getElementById('chat-button');
const chatWidget = document.getElementById('chat-widget');
const closeChat = document.getElementById('close-chat');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');

chatButton.addEventListener('click', () => { //Abre o chat, desativando o hidden do chat
    chatWidget.classList.toggle('hidden');
});

closeChat.addEventListener('click', () => { //Fecha o chat, desativando o hidden do chat
    chatWidget.classList.add('hidden');
});

chatForm.addEventListener('submit', async (e) => { //Recebe o input, envia para o gemini e retorna a resposta
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('Você', message);
    userInput.value = '';

    const response = await callGeminiFlash("---GEMINI API KEY AQUI---", message);
    if (response?.candidates[0]?.content?.parts[0]?.text) {
        appendMessage('SAMU', response?.candidates[0]?.content?.parts[0]?.text);
    } else {
        appendMessage('SAMU', "Não consigo te responder no momento.");
    }
});

function appendMessage(sender, text) { //Salva o input no historico do chat
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function callGeminiFlash(paramAPIKey, paramMessage) { //Chama API do gemini

    let prompt = `
        Você é um atendente virtual do SAMU (Serviço de Atendimento Móvel de Urgência). Seu objetivo é fornecer orientações corretas e seguras sobre primeiros socorros e emergências médicas.

        Suas respostas devem seguir estas regras:

        Use linguagem clara, objetiva e calma, sem gerar pânico.

        Responda com respostas curtas.

        Não invente tratamentos ou medicações — apenas oriente com práticas de primeiros socorros reconhecidas.

        Explique como agir em situações de urgência (como engasgo, parada cardíaca, desmaio, hemorragia, queimaduras, acidentes domésticos, acidentes de trânsito etc.).

        Seja educativo, explicando brevemente o motivo das ações que recomenda (por exemplo: “Coloque a pessoa deitada e eleve as pernas para melhorar a circulação”).

        Mantenha empatia, demonstrando cuidado com a pessoa em situação de emergência.

        `
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const rawBody = JSON.stringify({
        "contents": [
            {
                "parts": [
                    { "text": prompt },
                    { "text": paramMessage }

                ]
            }
        ]
    }
    );

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: rawBody,
        redirect: 'follow'
    };


    const constURL = 'https://generativelanguage.googleapis.com';
    const constENDPOINT = `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${paramAPIKey}`;

    try {
        let letResponse = await fetch(`${constURL}${constENDPOINT}`, requestOptions);

        if (!letResponse.ok) {
            const errorText = await letResponse.text().catch(() => '');
            //throw new Error(`Erro ao enviar prompt: ${letResponse.status} - ${letResponse.statusText}\n${errorText}`);
        }
        return await letResponse.json();
    } catch (error) {
        console.error('Erro:', error);
        //throw new Error('Falha ao enviar prompt');
    }
}