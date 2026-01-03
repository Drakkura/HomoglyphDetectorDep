import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import time
app = Flask(__name__) 
CORS(app)

def load_homoglyphs(filename="chars.txt"):
    homoglyph_map = {}
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or not line:
                    continue
                
                chars_in_line = [c for c in line if not c.isspace()]
                
                if len(chars_in_line) > 1:
                    base_char = chars_in_line[0]
                    for variant_char in chars_in_line[1:]:
                        homoglyph_map[variant_char] = base_char
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
        return None
    return homoglyph_map

def clean_url(url):
    cleaned = re.sub(r'^https?://', '', url, flags=re.IGNORECASE)
    cleaned = re.sub(r'^www\.', '', cleaned, flags=re.IGNORECASE)
    return cleaned

def partition_url_with_path(cleaned_url):
    parts = cleaned_url.split('/', 1)
    hostname = parts[0]
    path = parts[1] if len(parts) > 1 else None

    host_parts = hostname.split('.')
    if len(host_parts) >= 2:
        tld = host_parts[-1]
        domain = host_parts[-2]
        subdomain = '.'.join(host_parts[:-2]) if len(host_parts) > 2 else None
        return subdomain, domain, tld, path
    else:
        return None, hostname, None, path

def detect_homoglyphs(url_part, homoglyph_map):
    if not url_part:
        return []
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:/?#[]@!$&'()*+,;=%"
    
    found_homoglyphs = []
    for index, char in enumerate(url_part):
        if char in homoglyph_map and char not in safe_chars:
            unicode_code = f"U+{ord(char):04X}" 
            target_char = homoglyph_map[char]
            target_unicode_code = f"U+{ord(target_char):04X}"
            found_homoglyphs.append((char, target_char, index, unicode_code, target_unicode_code))
            
    return found_homoglyphs

homoglyphs = load_homoglyphs()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('.', filename)

@app.route('/detect', methods=['POST'])
def detect_api():
    if homoglyphs is None:
        return jsonify({"error": "Homoglyph data ('chars.txt') could not be loaded."}), 500

    data = request.get_json()
    if not data or 'url' not in data or not data['url'].strip():
        return jsonify({"error": "A URL must be provided."}), 400

    url_input = data['url']
    cleaned_url = clean_url(url_input)
    subdomain, domain, tld, path = partition_url_with_path(cleaned_url)

    response_data = {
        "cleaned_url": cleaned_url,
        "partitions": {
            "Subdomain": subdomain or 'N/A',
            "Domain": domain,
            "TLD": tld or 'N/V',
            "Path": path or 'N/A'
        },
        "detections": []
    }
    
    overall_detection = False

    def process_part(part_name, part_value):
        nonlocal overall_detection
        if not part_value:
            return
        
        detected_list = detect_homoglyphs(part_value, homoglyphs)
        if detected_list:
            overall_detection = True
            response_data["detections"].append({
                "part": part_name,
                "findings": [
                    {
                        "char": orig, 
                        "looks_like": ascii_eq, 
                        "index": idx,
                        "unicode": uni_code,
                        "looks_like_unicode": target_uni
                    } 
                    for orig, ascii_eq, idx, uni_code, target_uni in detected_list
                ]
            })

    process_part("Subdomain", subdomain)
    process_part("Domain", domain)
    process_part("TLD", tld)
    process_part("Path", path)

    if overall_detection:
        response_data["summary_message"] = "Warning: This URL contains characters that could be used in a homoglyph attack."
    else:
        response_data["summary_message"] = "This URL appears to be free of the checked homoglyphs."
    #time.sleep(3)
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)