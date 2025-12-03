from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.get_json() or {}
    model = data.get('model', '')
    prompt = data.get('prompt', '') or ''
    title = f"Generated: {prompt[:40]}"
    scene_desc = (prompt[:120] + '...') if len(prompt) > 120 else prompt
    out = {
        "output": {
            "title": title,
            "scenes": [
                {
                    "id": 1,
                    "description": f"Scene from prompt: {scene_desc}",
                    "duration": 10,
                    "camera": "wide",
                    "actions": [],
                    "dialog": []
                }
            ]
        }
    }
    return jsonify(out)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=11434)
