const socket = io('http://localhost:3006');
const logsContainer = document.getElementById('logs-container');
const anomaliesContainer = document.getElementById('anomalies-container');
const ticketsContainer = document.getElementById('tickets-container');
const aiResolutionContent = document.getElementById('ai-resolution-content');
const logsCountBadge = document.querySelector('.logs-count');
const voiceEnable = document.getElementById('voice-enable');
const brainIcon = document.getElementById('ai-brain');

let logsCount = 0;
let services = {}; // Store service nodes for topology

// --- TOPOLOGY ENGINE ---
const canvas = document.getElementById('topology-canvas');
const ctx = canvas.getContext('2d');
let nodes = {
    'gateway':  { x: 100, y: 150, label: 'API Gateway', status: 'healthy' },
    'logs':     { x: 300, y: 80,  label: 'Log Service', status: 'healthy' },
    'anomaly':  { x: 500, y: 80,  label: 'Anomaly Det.', status: 'healthy' },
    'ticket':   { x: 700, y: 150, label: 'Ticket Svc', status: 'healthy' },
    'ai':       { x: 500, y: 220, label: 'AI Engine',   status: 'healthy' },
    'action':   { x: 300, y: 220, label: 'Action Svc', status: 'healthy' }
};

let pulses = [];

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Connections
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nodes.gateway.x, nodes.gateway.y); ctx.lineTo(nodes.logs.x, nodes.logs.y);
    ctx.lineTo(nodes.anomaly.x, nodes.anomaly.y); ctx.lineTo(nodes.ticket.x, nodes.ticket.y);
    ctx.moveTo(nodes.ticket.x, nodes.ticket.y); ctx.lineTo(nodes.ai.x, nodes.ai.y);
    ctx.lineTo(nodes.action.x, nodes.action.y); ctx.lineTo(nodes.gateway.x, nodes.gateway.y);
    ctx.stroke();

    // Draw Pulses
    pulses = pulses.filter(p => p.t < 1);
    pulses.forEach(p => {
        p.t += 0.02;
        const x = p.from.x + (p.to.x - p.from.x) * p.t;
        const y = p.from.y + (p.to.y - p.from.y) * p.t;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
        // Glow
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f0ff';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Nodes
    Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        ctx.fillStyle = node.status === 'healthy' ? '#39ff14' : '#ff003c';
        ctx.beginPath(); ctx.arc(node.x, node.y, 8, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#909090';
        ctx.font = '10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 20);

        if (node.status === 'unhealthy') {
            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(node.x, node.y, 12 + Math.sin(Date.now()/100)*3, 0, Math.PI*2); ctx.stroke();
        }
    });

    requestAnimationFrame(draw);
}
draw();

function triggerPulse(fromKey, toKey) {
    pulses.push({ from: nodes[fromKey], to: nodes[toKey], t: 0 });
}

// --- SOCKET HANDLERS ---
socket.on('logs', (data) => {
    addLog(data);
    triggerPulse('gateway', 'logs');
    if (data.level === 'CRITICAL') {
        nodes.gateway.status = 'unhealthy';
        speak(`Alert. Critical log detected from ${data.serviceName}`);
    }
});

socket.on('anomalies', (data) => {
    addAnomaly(data);
    triggerPulse('logs', 'anomaly');
    nodes.logs.status = 'unhealthy';
});

socket.on('tickets', (data) => {
    addTicket(data);
    showAIProcessing(data);
    triggerPulse('anomaly', 'ticket');
    nodes.anomaly.status = 'unhealthy';
});

socket.on('resolutions', (data) => {
    updateAIResolution(data);
    triggerPulse('ticket', 'ai');
    nodes.ai.status = 'healthy';
});

socket.on('fix-executions', (data) => {
    updateTerminal(data);
    if (data.status === 'STARTING') triggerPulse('ai', 'action');
});

// --- UI LOGIC ---
function addLog(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.level.toLowerCase()}`;
    const time = new Date(log.timestamp).toLocaleTimeString();
    entry.innerHTML = `<div class="log-meta">[${time}] ${log.serviceName}</div><div class="log-msg">${log.message}</div>`;
    logsContainer.prepend(entry);
    logsCount++; logsCountBadge.textContent = logsCount;
}

function addAnomaly(anomaly) {
    if (anomaliesContainer.querySelector('.empty-state')) anomaliesContainer.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'incident-card anomaly';
    card.innerHTML = `<div class="card-title">⚠️ ${anomaly.anomalyType}</div><p>${anomaly.message}</p>`;
    anomaliesContainer.prepend(card);
}

function addTicket(ticket) {
    if (ticketsContainer.querySelector('.empty-state')) ticketsContainer.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'incident-card ticket';
    card.setAttribute('data-id', ticket.id);
    card.innerHTML = `<div class="card-title">🎫 TICKET: ${ticket.id.substring(0, 8)}</div><p>Severity: ${ticket.severity}</p>`;
    ticketsContainer.prepend(card);
}

function showAIProcessing(ticket) {
    brainIcon.classList.add('brain-thinking');
    document.getElementById('latest-ticket-id').textContent = `TICKET-${ticket.id.substring(0, 4)}`;
    aiResolutionContent.innerHTML = `<div class="res-box">AI Guardian is analyzing root causes...</div>`;
}

function updateAIResolution(res) {
    brainIcon.classList.remove('brain-thinking');
    const confidence = (res.confidence * 100).toFixed(0);
    aiResolutionContent.innerHTML = `
        <div class="res-grid">
            <div class="res-section"><h3>Root Cause</h3><div class="res-box">${res.cause}</div></div>
            <div class="res-section"><h3>Fix Plan</h3><div class="res-box">${res.fix}</div></div>
        </div>
        <div class="confidence-meter">AI CONFIDENCE: ${confidence}%</div>
        <button onclick="approveFix('${res.ticketId}')" class="btn btn-approve">APPROVE AUTO-FIX</button>
    `;
    speak(`Resolution generated with ${confidence} percent confidence. Ready for approval.`);
}

async function approveFix(ticketId) {
    const btn = document.querySelector('.btn-approve');
    if (btn) btn.disabled = true;
    
    document.getElementById('terminal-container').style.display = 'flex';
    document.getElementById('terminal-output').innerHTML = '<div class="terminal-line">> Initializing Secure SSH Tunnel...</div>';
    
    try {
        await fetch(`http://localhost:3005/auto-fix/${ticketId}`, { method: 'POST' });
    } catch (err) {
        updateTerminal({ status: 'ERROR', output: 'Failed to connect to Action Service' });
        if (btn) btn.disabled = false;
    }
}

function updateTerminal(data) {
    const output = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `> ${data.output}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;

    if (data.status === 'COMPLETED' && data.success) {
        nodes.gateway.status = 'healthy';
        nodes.logs.status = 'healthy';
        nodes.anomaly.status = 'healthy';
        nodes.ai.status = 'healthy';
        speak("System restoration complete. Ticket has been resolved.");
        
        // Remove the ticket card from UI
        const ticketCard = document.querySelector(`.incident-card.ticket[data-id="${data.ticketId}"]`);
        if (ticketCard) {
            ticketCard.style.border = '1px solid #39ff14';
            setTimeout(() => {
                ticketCard.remove();
                if (ticketsContainer.children.length === 0) {
                    ticketsContainer.innerHTML = '<div class="empty-state">No active tickets</div>';
                }
            }, 2000);
        }

        // Clear AI Panel after success
        setTimeout(() => {
            aiResolutionContent.innerHTML = '<div class="res-box">AI Guardian monitoring for anomalies...</div>';
            document.getElementById('latest-ticket-id').textContent = 'AI ANALYSIS';
        }, 3000);
    } else if (data.status === 'COMPLETED' && !data.success) {
        speak("Warning. Automated resolution failed. Manual intervention required.");
        document.querySelector('.btn-approve')?.removeAttribute('disabled');
    }
}

function speak(text) {
    if (!voiceEnable.checked) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8; // Cyberpunk deep voice
    window.speechSynthesis.speak(utterance);
}

async function simulateCrash() {
    const payload = { source: "simulator", serviceName: "payment-api", level: "CRITICAL", message: "DB_CONN_TIMEOUT: Pool exhausted", timestamp: new Date().toISOString() };
    await fetch('http://localhost:3001/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
