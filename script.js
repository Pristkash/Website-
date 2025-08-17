document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('youtube-url');
    const fetchBtn = document.getElementById('fetch-btn');
    const resultsSection = document.getElementById('results-section');
    const videoTitle = document.getElementById('video-title');
    const qualitySelector = document.getElementById('quality-selector');
    const downloadBtn = document.getElementById('download-btn');
    const statusMessage = document.getElementById('status-message');

    fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            statusMessage.textContent = 'Please enter a YouTube URL.';
            return;
        }

        // Reset UI
        resultsSection.style.display = 'none';
        statusMessage.textContent = 'Fetching video information...';
        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Fetching...';

        try {
            const response = await fetch('/get_video_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url }),
            });

            const result = await response.json();

            if (response.ok) {
                videoTitle.textContent = result.title;
                qualitySelector.innerHTML = ''; // Clear previous options

                if (result.formats && result.formats.length > 0) {
                    result.formats.forEach(format => {
                        const option = document.createElement('option');
                        option.value = format.format_id;
                        option.textContent = format.resolution;
                        qualitySelector.appendChild(option);
                    });
                    resultsSection.style.display = 'block';
                    statusMessage.textContent = '';
                } else {
                    statusMessage.textContent = 'No downloadable video formats found.';
                }
            } else {
                statusMessage.textContent = `Error: ${result.error || 'Unknown error'}`;
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            statusMessage.textContent = 'Failed to connect to the server. Please try again.';
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Fetch Qualities';
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const formatId = qualitySelector.value;

        if (!url || !formatId) {
            statusMessage.textContent = 'Something went wrong. Please fetch the video qualities again.';
            return;
        }

        statusMessage.textContent = 'Preparing download... This may take a moment.';
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Downloading...';

        try {
            const response = await fetch('/download_video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, format_id: formatId }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const tempUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = tempUrl;
                // Get filename from content-disposition header
                const disposition = response.headers.get('content-disposition');
                let filename = 'video.mp4'; // default
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(tempUrl);
                document.body.removeChild(a);
                statusMessage.textContent = 'Download started!';
            } else {
                const result = await response.json();
                statusMessage.textContent = `Error: ${result.error || 'Failed to start download.'}`;
            }
        } catch (error) {
            console.error('Download Error:', error);
            statusMessage.textContent = 'An error occurred while trying to download the video.';
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download';
        }
    });
});
