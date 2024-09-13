<?php

require 'vendor/autoload.php'; // Make sure to include Composer's autoloader

use GuzzleHttp\Client;
use GuzzleHttp\Promise;

function downloadFiles(array $urls, $saveToDirectory)
{
    $client = new Client();
    $promises = [];
    
    foreach ($urls as $url) {
        $filename = basename($url);
        $promises[] = $client->getAsync($url, [
            'sink' => $saveToDirectory . '/' . $filename
        ]);
    }

    // Wait for all promises to settle
    $results = Promise\settle($promises)->wait();

    foreach ($results as $result) {
        if ($result['state'] === 'fulfilled') {
            echo "File downloaded successfully: " . $result['value']->getRequest()->getUri() . PHP_EOL;
        } else {
            echo "Error downloading file: " . $result['reason']->getMessage() . PHP_EOL;
        }
    }
}

if ($argc < 3) {
    echo "Usage: php downloadFiles.php <path_to_file_with_urls> <path_to_save_files>" . PHP_EOL;
    exit(1);
}

$urlsFile = $argv[1];
$saveToDirectory = $argv[2];

if (!file_exists($urlsFile)) {
    echo "File with URLs not found." . PHP_EOL;
    exit(1);
}

if (!is_dir($saveToDirectory)) {
    echo "Directory for saving files does not exist." . PHP_EOL;
    exit(1);
}

$urls = file($urlsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (!$urls) {
    echo "No URLs found in the file." . PHP_EOL;
    exit(1);
}

downloadFiles($urls, $saveToDirectory);
