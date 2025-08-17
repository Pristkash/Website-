document.addEventListener('DOMContentLoaded', () => {
    // State
    let gameState = {};

    // Containers
    const authContainer = document.getElementById('auth-container');
    const gameContainer = document.getElementById('game');

    // Auth Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');

    // Auth Form Toggling
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginMessage.textContent = '';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerMessage.textContent = '';
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Game Elements
    const terminal = document.getElementById('terminal');
    const commandInput = document.getElementById('command-input');

    // --- Authentication Logic ---
    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        registerMessage.textContent = result.message;
        if (result.success) {
            registerMessage.classList.add('success');
        } else {
            registerMessage.classList.remove('success');
        }
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            gameState = {
                username: username,
                progress: result.progress
            };
            showGame();
            initializeGame();
        } else {
            loginMessage.textContent = result.message;
            loginMessage.classList.remove('success');
        }
    });

    // --- Game Logic ---
    function showGame() {
        authContainer.style.display = 'none';
        gameContainer.style.display = 'flex';
        commandInput.focus();
    }

    function initializeGame() {
        terminal.innerHTML = ''; // Clear terminal
        const welcomeMessage = document.createElement('div');
        welcomeMessage.textContent = `Welcome, ${gameState.username}. Type 'help' for a list of commands.`;
        terminal.appendChild(welcomeMessage);

        // TODO: Check if tutorial is needed
    }

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = commandInput.value.trim();
            commandInput.value = '';

            if (command) {
                const output = document.createElement('div');
                output.innerHTML = `<span class="prompt">></span> ${command}`;
                terminal.appendChild(output);

                processCommand(command);
            }
            terminal.scrollTop = terminal.scrollHeight;
        }
    });

    function processCommand(command) {
        const output = document.createElement('div');
        // Basic command processing
        switch(command.toLowerCase()) {
            case 'help':
                output.textContent = 'Available commands: help, clear, whoami';
                break;
            case 'clear':
                terminal.innerHTML = '';
                return; // Don't append an empty div
            case 'whoami':
                output.textContent = gameState.username;
                break;
            default:
                output.textContent = `Command not found: ${command}`;
                break;
        }
        terminal.appendChild(output);
    }
});
