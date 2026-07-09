import { useImportStore } from '@/store/importStore';

export function useImportStream() {
  const { file, startImport, updateProgress, finishImport, failImport } = useImportStore();

  /**
   * Uploads the file and consumes the Server-Sent Events stream from the POST response.
   */
  const runImportStream = async () => {
    if (!file) return;

    startImport();

    const formData = new FormData();
    formData.append('file', file);

    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }


    try {
      const response = await fetch(`${apiUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server upload failed' }));
        throw new Error(errorData.message || 'Failed to upload CSV');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response is not supported by your browser');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE protocol splits events by newlines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Buffer trailing line fragment

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith(':')) continue; // Ignore heartbeat comments

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataString = trimmed.substring(5).trim();
            
            try {
              const data = JSON.parse(dataString);
              
              if (currentEvent === 'batch_progress') {
                updateProgress(data);
              } else if (currentEvent === 'import_complete') {
                finishImport(data);
              } else if (currentEvent === 'error') {
                throw new Error(data.message || 'Import aborted with errors');
              }
            } catch (err: any) {
              console.error('Error parsing SSE JSON payload:', err.message);
            }
          }
        }
      }
    } catch (err: any) {
      failImport(err.message || 'Import stream connection broken');
    }
  };

  return { runImportStream };
}
