<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class InfoController extends Controller
{
    public function index(): View
    {
        $info = [
            'app' => [
                'name' => config('app.name'),
                'environment' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
            ],
            'php' => [
                'version' => PHP_VERSION,
                'sapi' => PHP_SAPI,
                'extensions' => get_loaded_extensions(),
            ],
            'laravel' => [
                'version' => app()->version(),
            ],
            'server' => [
                'hostname' => gethostname(),
                'os' => PHP_OS,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'N/A',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
            ],
            'request' => [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ];

        return view('info', compact('info'));
    }
}
