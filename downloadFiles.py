import aiohttp
import asyncio
import aiofiles
import os
import time

file_path = 'urls.txt'
download_directory = './downloaded_sds_files'
os.makedirs(download_directory, exist_ok=True)

# optimize connection pool settings
MAX_CONNECTIONS = 100

async def download_pdf(session, url, download_directory):
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            
            filename = url.split('/')[-1]
            file_path = os.path.join(download_directory, filename)
            
            # read and write the content asynchronously
            content = await response.read()
            async with aiofiles.open(file_path, 'wb') as file:
                await file.write(content)
            
            print(f"Downloaded: {filename}")
    except Exception as e:
        print(f"Failed to download {url}. Error: {e}")

async def download_pdfs_from_file(file_path, download_directory):
    try:
        with open(file_path, 'r') as file:
            urls = [url.strip() for url in file if url.strip()]

        # start benchmarking
        start_time = time.time()
        print("Download started...")

        # configure the connector to allow more connections and tune timeouts
        connector = aiohttp.TCPConnector(limit=MAX_CONNECTIONS)
        timeout = aiohttp.ClientTimeout(total=None, connect=60, sock_read=60)

        # use a single session for all requests to improve performance
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            tasks = [download_pdf(session, url, download_directory) for url in urls]
            await asyncio.gather(*tasks)

        # end benchmarking
        end_time = time.time()
        duration = end_time - start_time
        print(f"Download completed in {duration:.2f} seconds.")

    except FileNotFoundError:
        print(f"File not found: {file_path}")

# running the main async function
if __name__ == '__main__':
    asyncio.run(download_pdfs_from_file(file_path, download_directory))
