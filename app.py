import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_bcrypt import Bcrypt
from flask_cors import CORS

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)

# Construct a robust, absolute path to the database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'database.json')

def read_db():
    if not os.path.exists(DB_FILE):
        return {'users': {}}
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def write_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Serve other static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    db = read_db()
    if username in db['users']:
        return jsonify({'success': False, 'message': 'Username already exists.'}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    db['users'][username] = {
        'password': hashed_password,
        'progress': {
            'level': 1,
            'tutorialCompleted': False
        }
    }
    write_db(db)
    return jsonify({'success': True, 'message': 'Registration successful. Please log in.'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    db = read_db()
    user = db['users'].get(username)

    if not user:
        return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401

    if bcrypt.check_password_hash(user['password'], password):
        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'progress': user['progress']
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401

if __name__ == '__main__':
    app.run(debug=False, port=5000)
