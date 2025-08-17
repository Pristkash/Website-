from flask import Flask, request, jsonify, send_from_directory, send_file, after_this_request
import yt_dlp
import os
import sys

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/get_video_info', methods=['POST'])
def get_video_info():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        ydl_opts = {'quiet': True, 'no_warnings': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            formats = []
            for f in info.get('formats', []):
                if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('ext') == 'mp4' and f.get('height'):
                    formats.append({
                        'resolution': f.get('format_note'),
                        'format_id': f.get('format_id')
                    })

            unique_formats = []
            seen_resolutions = set()
            for f in formats:
                if f['resolution'] not in seen_resolutions:
                    unique_formats.append(f)
                    seen_resolutions.add(f['resolution'])

            video_info = {
                'title': info.get('title', 'No title found'),
                'formats': unique_formats
            }
            return jsonify(video_info)

    except yt_dlp.utils.DownloadError as e:
        return jsonify({'error': 'Invalid YouTube URL or video is unavailable.'}), 400
    except Exception as e:
        print(f"Error in get_video_info: {e}", file=sys.stderr)
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/download_video', methods=['POST'])
def download_video():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    if not url or not format_id:
        return jsonify({'error': 'URL and format ID are required'}), 400

    try:
        # --- Diagnostic: Test if /tmp is writable ---
        try:
            with open('/tmp/test_write.txt', 'w') as f:
                f.write('test')
            print("Successfully wrote to /tmp", file=sys.stderr)
        except Exception as e:
            print(f"Failed to write to /tmp: {e}", file=sys.stderr)
            # Also return this error to the client for immediate feedback
            return jsonify({'error': f'Filesystem error: cannot write to /tmp. {str(e)}'}), 500
        # --- End Diagnostic ---

        print(f"Starting download for URL: {url} with format: {format_id}", file=sys.stderr)

        info_ydl_opts = {'quiet': True, 'no_warnings': True}
        with yt_dlp.YoutubeDL(info_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'video')
            filename = "".join([c for c in title if c.isalpha() or c.isdigit() or c.isspace()]).rstrip()
            filepath = f"/tmp/{filename}.mp4"
            print(f"Downloading to temporary file: {filepath}", file=sys.stderr)

        ydl_opts = {
            'format': format_id,
            'outtmpl': filepath,
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        print(f"Download complete. Sending file.", file=sys.stderr)

        @after_this_request
        def cleanup(response):
            try:
                print(f"Cleaning up temporary file: {filepath}", file=sys.stderr)
                os.remove(filepath)
            except Exception as e:
                print(f"Error during cleanup: {e}", file=sys.stderr)
            return response

        return send_file(filepath, as_attachment=True)

    except Exception as e:
        print(f"Error in download_video: {e}", file=sys.stderr)
        return jsonify({'error': f'An unexpected error occurred during download: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
